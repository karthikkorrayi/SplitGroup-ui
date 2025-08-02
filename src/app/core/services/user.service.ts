import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  UserProfile, 
  SearchUsersResponse, 
  UserPreferences, 
  User,
  UpdateProfileRequest,
  UploadAvatarResponse 
} from '../../shared/models/user.model';

/**
 * UserService - Comprehensive user management service
 * 
 * This service handles all user-related operations including:
 * - Profile management (view, edit, update)
 * - User search functionality for adding friends
 * - Avatar/profile picture handling
 * - User preferences management
 * - Caching for performance optimization
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;
  
  // Cache management for better performance
  private userProfileCache = new Map<number, UserProfile>();
  private searchCache = new Map<string, SearchUsersResponse>();
  
  // Loading states for UI feedback
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Current user profile state
  private currentProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentProfile$ = this.currentProfileSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get user profile by ID with caching
   * Uses cache-first strategy for better performance
   */
  getUserProfile(userId: number, forceRefresh = false): Observable<UserProfile> {
    // Check cache first unless force refresh is requested
    if (!forceRefresh && this.userProfileCache.has(userId)) {
      return of(this.userProfileCache.get(userId)!);
    }

    this.setLoading(true);
    return this.http.get<UserProfile>(`${this.API_URL}/profiles/${userId}`)
      .pipe(
        tap(profile => {
          // Update cache
          this.userProfileCache.set(userId, profile);
          
          // Update current profile if it's the same user
          const currentProfile = this.currentProfileSubject.value;
          if (currentProfile && currentProfile.userId === userId) {
            this.currentProfileSubject.next(profile);
          }
          
          console.log('User profile fetched:', profile);
        }),
        catchError(error => this.handleError('Failed to fetch user profile', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Update user profile with optimistic updates
   * Implements optimistic UI pattern for better user experience
   */
  updateUserProfile(userId: number, updates: UpdateProfileRequest): Observable<UserProfile> {
    const currentProfile = this.userProfileCache.get(userId);
    
    // Optimistic update - immediately update the UI
    if (currentProfile) {
      const optimisticProfile = { ...currentProfile, ...updates };
      this.userProfileCache.set(userId, optimisticProfile);
      this.currentProfileSubject.next(optimisticProfile);
    }

    this.setLoading(true);
    return this.http.put<UserProfile>(`${this.API_URL}/profiles/${userId}`, updates)
      .pipe(
        tap(updatedProfile => {
          // Update cache with server response
          this.userProfileCache.set(userId, updatedProfile);
          this.currentProfileSubject.next(updatedProfile);
          console.log('Profile updated successfully:', updatedProfile);
        }),
        catchError(error => {
          // Revert optimistic update on error
          if (currentProfile) {
            this.userProfileCache.set(userId, currentProfile);
            this.currentProfileSubject.next(currentProfile);
          }
          return this.handleError('Failed to update profile', error);
        }),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Search users by email with debouncing and caching
   * Implements efficient search with automatic debouncing
   */
  searchUsersByEmail(email: string): Observable<SearchUsersResponse> {
    if (!email.trim()) {
      return of({ users: [], total: 0 });
    }

    // Check cache first
    const cacheKey = email.toLowerCase().trim();
    if (this.searchCache.has(cacheKey)) {
      return of(this.searchCache.get(cacheKey)!);
    }

    const params = new HttpParams().set('q', email);
    
    return this.http.get<SearchUsersResponse>(`${this.API_URL}/search/email`, { params })
      .pipe(
        tap(response => {
          // Cache the search result
          this.searchCache.set(cacheKey, response);
          console.log('User search completed:', response);
        }),
        catchError(error => this.handleError('Failed to search users', error))
      );
  }

  /**
   * Create a debounced search observable
   * This is used by components to implement real-time search
   */
  createDebouncedSearch(searchTerm$: Observable<string>, debounceMs = 300): Observable<SearchUsersResponse> {
    return searchTerm$.pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      switchMap(term => this.searchUsersByEmail(term))
    );
  }

  /**
   * Upload user avatar with progress tracking
   * Handles file upload with proper error handling
   */
  uploadAvatar(userId: number, file: File): Observable<UploadAvatarResponse> {
    if (!this.isValidImageFile(file)) {
      return throwError(() => new Error('Invalid file type. Please upload a valid image file.'));
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return throwError(() => new Error('File size too large. Please upload an image smaller than 5MB.'));
    }

    const formData = new FormData();
    formData.append('avatar', file);

    this.setLoading(true);
    return this.http.post<UploadAvatarResponse>(`${this.API_URL}/profiles/${userId}/avatar`, formData)
      .pipe(
        tap(response => {
          // Update cached profile with new avatar
          const cachedProfile = this.userProfileCache.get(userId);
          if (cachedProfile) {
            const updatedProfile = { ...cachedProfile, avatar: response.avatarUrl };
            this.userProfileCache.set(userId, updatedProfile);
            this.currentProfileSubject.next(updatedProfile);
          }
          console.log('Avatar uploaded successfully:', response);
        }),
        catchError(error => this.handleError('Failed to upload avatar', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: number): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.API_URL}/${userId}/preferences`)
      .pipe(
        tap(preferences => console.log('User preferences fetched:', preferences)),
        catchError(error => this.handleError('Failed to fetch user preferences', error))
      );
  }

  /**
   * Update user preferences with local storage sync
   */
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    this.setLoading(true);
    return this.http.put<UserPreferences>(`${this.API_URL}/${userId}/preferences`, preferences)
      .pipe(
        tap(updatedPreferences => {
          // Sync with local storage for offline access
          this.syncPreferencesToLocalStorage(userId, updatedPreferences);
          console.log('User preferences updated:', updatedPreferences);
        }),
        catchError(error => this.handleError('Failed to update user preferences', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get multiple user profiles efficiently
   * Useful for displaying participant information
   */
  getMultipleUserProfiles(userIds: number[]): Observable<UserProfile[]> {
    const uncachedIds = userIds.filter(id => !this.userProfileCache.has(id));
    
    if (uncachedIds.length === 0) {
      // All profiles are cached
      const profiles = userIds.map(id => this.userProfileCache.get(id)!);
      return of(profiles);
    }

    // Fetch uncached profiles
    const params = new HttpParams().set('ids', uncachedIds.join(','));
    
    return this.http.get<UserProfile[]>(`${this.API_URL}/profiles/batch`, { params })
      .pipe(
        tap(profiles => {
          // Update cache
          profiles.forEach(profile => {
            this.userProfileCache.set(profile.userId, profile);
          });
        }),
        map(fetchedProfiles => {
          // Combine cached and fetched profiles
          return userIds.map(id => 
            this.userProfileCache.get(id) || 
            fetchedProfiles.find(p => p.userId === id)!
          );
        }),
        catchError(error => this.handleError('Failed to fetch user profiles', error))
      );
  }

  /**
   * Clear user cache (useful for logout or data refresh)
   */
  clearCache(): void {
    this.userProfileCache.clear();
    this.searchCache.clear();
    this.currentProfileSubject.next(null);
    console.log('User service cache cleared');
  }

  /**
   * Get cached profile (synchronous)
   */
  getCachedProfile(userId: number): UserProfile | null {
    return this.userProfileCache.get(userId) || null;
  }

  // Private helper methods

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  }

  private syncPreferencesToLocalStorage(userId: number, preferences: UserPreferences): void {
    try {
      const key = `user_preferences_${userId}`;
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to sync preferences to local storage:', error);
    }
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);
    
    let userMessage = message;
    if (error.status === 404) {
      userMessage = 'User not found';
    } else if (error.status === 403) {
      userMessage = 'Access denied';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }

    return throwError(() => new Error(userMessage));
  }
}