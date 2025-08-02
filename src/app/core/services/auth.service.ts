import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, LoginResponse, RefreshTokenResponse, User } from '../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'splitgroup_token';
  private readonly USER_KEY = 'splitgroup_user';
  private isBrowser: boolean;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initializeFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          this.storeAuthData(response);
          this.showMessage('Login successful!', 'success-snackbar');
          console.log('Login successful:', response);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return this.handleError(error);
        }),
        tap(() => this.setLoading(false))
      );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    this.setLoading(true);
    return this.http.post<LoginResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          this.storeAuthData(response);
          this.showMessage('Registration successful! Welcome to SplitGroup!', 'success-snackbar');
          console.log('Registration successful:', response);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return this.handleError(error);
        }),
        tap(() => this.setLoading(false))
      );
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return throwError(() => new Error('No token available for refresh'));
    }
    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh`, {})
      .pipe(
        tap(response => {
          this.setToken(response.token);
          console.log('Token refreshed successfully');
        }),
        catchError(error => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`)
      .pipe(
        tap(user => {
          this.updateCurrentUser(user);
          console.log('Current user fetched:', user);
        }),
        catchError(error => {
          console.error('Failed to fetch current user:', error);
          return this.handleError(error);
        })
      );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/auth/login']);
    this.showMessage('Logged out successfully', 'info-snackbar');
    console.log('User logged out');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isValid = payload.exp > Date.now() / 1000;
      if (!isValid) {
        console.log('Token expired, logging out...');
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
      return false;
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUserValue();
    // Implement role checking logic when backend supports it
    return true;
  }

  private initializeFromStorage(): void {
    if (this.isAuthenticated()) {
      // Optionally fetch fresh user data on app start
      this.getCurrentUser().subscribe({
        next: () => console.log('User data refreshed from backend'),
        error: (error) => console.warn('Failed to refresh user data:', error)
      });
    }
  }

  private storeAuthData(response: LoginResponse): void {
    if (!this.isBrowser) return;
    
    const user: User = {
      id: response.userId,
      name: response.name,
      email: response.email
    };
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    console.log('Auth data stored:', { user, tokenLength: response.token.length });
  }

  private clearAuthData(): void {
    if (!this.isBrowser) return;
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    console.log('Auth data cleared');
  }

  private setToken(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private updateCurrentUser(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getCurrentUserFromStorage(): User | null {
    if (!this.isBrowser) return null;
    
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to parse user data from storage:', error);
      return null;
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred';
    if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 0) {
      message = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status === 401) {
      message = 'Invalid credentials. Please try again.';
    } else if (error.status === 403) {
      message = 'Access denied. Please contact support.';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later.';
    }
    this.showMessage(message, 'error-snackbar');
    this.setLoading(false);
    return throwError(() => error);
  }

  private showMessage(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}