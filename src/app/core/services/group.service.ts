import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupMember,
  GroupInvitation,
  GroupTransaction,
  GroupBalance,
  GroupSettings,
  GroupActivity,
  GroupSummary,
  GroupPermission,
  GroupRole,
  InvitationRequest,
  BulkTransactionRequest
} from '../../shared/models/group.model';

/**
 * GroupService - Comprehensive group expense management service
 * 
 * This service handles all group-related operations including:
 * - Group creation and management
 * - Member invitation and management
 * - Group-specific transactions
 * - Group balance calculations
 * - Group settings and permissions
 * - Activity tracking and notifications
 */
@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly API_URL = `${environment.apiUrl}/groups`;
  
  // Cache management
  private groupCache = new Map<number, Group>();
  private userGroupsCache = new Map<number, Group[]>();
  private groupMembersCache = new Map<number, GroupMember[]>();
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private processingSubject = new BehaviorSubject<boolean>(false);
  public processing$ = this.processingSubject.asObservable();
  
  // Current user's groups
  private userGroupsSubject = new BehaviorSubject<Group[]>([]);
  public userGroups$ = this.userGroupsSubject.asObservable();
  
  // Active group state
  private activeGroupSubject = new BehaviorSubject<Group | null>(null);
  public activeGroup$ = this.activeGroupSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Create a new group with comprehensive settings
   */
  createGroup(groupData: CreateGroupRequest): Observable<Group> {
    const validationError = this.validateGroupData(groupData);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    this.setProcessing(true);
    return this.http.post<Group>(this.API_URL, groupData)
      .pipe(
        tap(createdGroup => {
          // Update cache
          this.groupCache.set(createdGroup.id, createdGroup);
          this.invalidateUserGroupsCache();
          
          console.log('Group created successfully:', createdGroup);
        }),
        catchError(error => this.handleError('Failed to create group', error)),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Get user's groups with caching and filtering
   */
  getUserGroups(userId: number, forceRefresh = false): Observable<Group[]> {
    // Check cache first
    if (!forceRefresh && this.userGroupsCache.has(userId)) {
      const cachedGroups = this.userGroupsCache.get(userId)!;
      this.userGroupsSubject.next(cachedGroups);
      return of(cachedGroups);
    }

    this.setLoading(true);
    return this.http.get<Group[]>(`${this.API_URL}/user/${userId}`)
      .pipe(
        tap(groups => {
          // Update cache
          this.userGroupsCache.set(userId, groups);
          this.userGroupsSubject.next(groups);
          
          // Cache individual groups
          groups.forEach(group => {
            this.groupCache.set(group.id, group);
          });
          
          console.log('User groups fetched:', groups);
        }),
        catchError(error => this.handleError('Failed to fetch user groups', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get group details with comprehensive information
   */
  getGroupDetails(groupId: number, forceRefresh = false): Observable<Group> {
    // Check cache first
    if (!forceRefresh && this.groupCache.has(groupId)) {
      return of(this.groupCache.get(groupId)!);
    }

    this.setLoading(true);
    return this.http.get<Group>(`${this.API_URL}/${groupId}`)
      .pipe(
        tap(group => {
          this.groupCache.set(groupId, group);
          
          // Update active group if it's the same
          const activeGroup = this.activeGroupSubject.value;
          if (activeGroup && activeGroup.id === groupId) {
            this.activeGroupSubject.next(group);
          }
          
          console.log('Group details fetched:', group);
        }),
        catchError(error => this.handleError('Failed to fetch group details', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Update group information with optimistic updates
   */
  updateGroup(groupId: number, updates: UpdateGroupRequest): Observable<Group> {
    const cachedGroup = this.groupCache.get(groupId);
    
    // Optimistic update
    if (cachedGroup) {
      const optimisticGroup = { ...cachedGroup, ...updates };
      this.groupCache.set(groupId, optimisticGroup);
      this.activeGroupSubject.next(optimisticGroup);
    }

    this.setProcessing(true);
    return this.http.put<Group>(`${this.API_URL}/${groupId}`, updates)
      .pipe(
        tap(updatedGroup => {
          // Update cache with server response
          this.groupCache.set(groupId, updatedGroup);
          this.activeGroupSubject.next(updatedGroup);
          this.invalidateUserGroupsCache();
          
          console.log('Group updated successfully:', updatedGroup);
        }),
        catchError(error => {
          // Revert optimistic update on error
          if (cachedGroup) {
            this.groupCache.set(groupId, cachedGroup);
            this.activeGroupSubject.next(cachedGroup);
          }
          return this.handleError('Failed to update group', error);
        }),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Delete group with confirmation
   */
  deleteGroup(groupId: number): Observable<void> {
    this.setProcessing(true);
    return this.http.delete<void>(`${this.API_URL}/${groupId}`)
      .pipe(
        tap(() => {
          // Remove from cache
          this.groupCache.delete(groupId);
          this.groupMembersCache.delete(groupId);
          this.invalidateUserGroupsCache();
          
          // Clear active group if it was deleted
          const activeGroup = this.activeGroupSubject.value;
          if (activeGroup && activeGroup.id === groupId) {
            this.activeGroupSubject.next(null);
          }
          
          console.log('Group deleted successfully:', groupId);
        }),
        catchError(error => this.handleError('Failed to delete group', error)),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Get group members with roles and permissions
   */
  getGroupMembers(groupId: number, forceRefresh = false): Observable<GroupMember[]> {
    // Check cache first
    if (!forceRefresh && this.groupMembersCache.has(groupId)) {
      return of(this.groupMembersCache.get(groupId)!);
    }

    return this.http.get<GroupMember[]>(`${this.API_URL}/${groupId}/members`)
      .pipe(
        tap(members => {
          this.groupMembersCache.set(groupId, members);
          console.log('Group members fetched:', members);
        }),
        catchError(error => this.handleError('Failed to fetch group members', error))
      );
  }

  /**
   * Add member to group
   */
  addMember(groupId: number, userId: number, role: GroupRole = GroupRole.MEMBER): Observable<GroupMember> {
    const request = { userId, role };
    
    this.setProcessing(true);
    return this.http.post<GroupMember>(`${this.API_URL}/${groupId}/members`, request)
      .pipe(
        tap(newMember => {
          // Update members cache
          const cachedMembers = this.groupMembersCache.get(groupId);
          if (cachedMembers) {
            this.groupMembersCache.set(groupId, [...cachedMembers, newMember]);
          }
          
          // Update group cache to reflect new member count
          const cachedGroup = this.groupCache.get(groupId);
          if (cachedGroup) {
            const updatedGroup = { 
              ...cachedGroup, 
              memberCount: cachedGroup.memberCount + 1 
            };
            this.groupCache.set(groupId, updatedGroup);
          }
          
          console.log('Member added successfully:', newMember);
        }),
        catchError(error => this.handleError('Failed to add member', error)),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Remove member from group
   */
  removeMember(groupId: number, userId: number): Observable<void> {
    this.setProcessing(true);
    return this.http.delete<void>(`${this.API_URL}/${groupId}/members/${userId}`)
      .pipe(
        tap(() => {
          // Update members cache
          const cachedMembers = this.groupMembersCache.get(groupId);
          if (cachedMembers) {
            const updatedMembers = cachedMembers.filter(m => m.userId !== userId);
            this.groupMembersCache.set(groupId, updatedMembers);
          }
          
          // Update group cache to reflect member count
          const cachedGroup = this.groupCache.get(groupId);
          if (cachedGroup) {
            const updatedGroup = { 
              ...cachedGroup, 
              memberCount: Math.max(0, cachedGroup.memberCount - 1) 
            };
            this.groupCache.set(groupId, updatedGroup);
          }
          
          console.log('Member removed successfully:', userId);
        }),
        catchError(error => this.handleError('Failed to remove member', error)),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Update member role and permissions
   */
  updateMemberRole(groupId: number, userId: number, role: GroupRole): Observable<GroupMember> {
    const request = { role };
    
    return this.http.put<GroupMember>(`${this.API_URL}/${groupId}/members/${userId}`, request)
      .pipe(
        tap(updatedMember => {
          // Update members cache
          const cachedMembers = this.groupMembersCache.get(groupId);
          if (cachedMembers) {
            const updatedMembers = cachedMembers.map(m => 
              m.userId === userId ? updatedMember : m
            );
            this.groupMembersCache.set(groupId, updatedMembers);
          }
          
          console.log('Member role updated:', updatedMember);
        }),
        catchError(error => this.handleError('Failed to update member role', error))
      );
  }

  /**
   * Send group invitation
   */
  sendInvitation(groupId: number, invitation: InvitationRequest): Observable<GroupInvitation> {
    this.setProcessing(true);
    return this.http.post<GroupInvitation>(`${this.API_URL}/${groupId}/invite`, invitation)
      .pipe(
        tap(sentInvitation => {
          console.log('Invitation sent successfully:', sentInvitation);
        }),
        catchError(error => this.handleError('Failed to send invitation', error)),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Get group transactions with filtering
   */
  getGroupTransactions(
    groupId: number, 
    page = 0, 
    size = 20, 
    filters?: any
  ): Observable<{ content: GroupTransaction[]; totalElements: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<{ content: GroupTransaction[]; totalElements: number }>(
      `${this.API_URL}/${groupId}/transactions`, 
      { params }
    )
      .pipe(
        tap(response => console.log('Group transactions fetched:', response)),
        catchError(error => this.handleError('Failed to fetch group transactions', error))
      );
  }

  /**
   * Get group balances
   */
  getGroupBalances(groupId: number): Observable<GroupBalance[]> {
    return this.http.get<GroupBalance[]>(`${this.API_URL}/${groupId}/balances`)
      .pipe(
        tap(balances => console.log('Group balances fetched:', balances)),
        catchError(error => this.handleError('Failed to fetch group balances', error))
      );
  }

  /**
   * Get group settings
   */
  getGroupSettings(groupId: number): Observable<GroupSettings> {
    return this.http.get<GroupSettings>(`${this.API_URL}/${groupId}/settings`)
      .pipe(
        tap(settings => console.log('Group settings fetched:', settings)),
        catchError(error => this.handleError('Failed to fetch group settings', error))
      );
  }

  /**
   * Update group settings
   */
  updateGroupSettings(groupId: number, settings: Partial<GroupSettings>): Observable<GroupSettings> {
    return this.http.put<GroupSettings>(`${this.API_URL}/${groupId}/settings`, settings)
      .pipe(
        tap(updatedSettings => console.log('Group settings updated:', updatedSettings)),
        catchError(error => this.handleError('Failed to update group settings', error))
      );
  }

  /**
   * Get group activity feed
   */
  getGroupActivity(groupId: number, limit = 50): Observable<GroupActivity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<GroupActivity[]>(`${this.API_URL}/${groupId}/activity`, { params })
      .pipe(
        tap(activities => console.log('Group activity fetched:', activities)),
        catchError(error => this.handleError('Failed to fetch group activity', error))
      );
  }

  /**
   * Get group summary with analytics
   */
  getGroupSummary(groupId: number, period?: { start: Date; end: Date }): Observable<GroupSummary> {
    let params = new HttpParams();
    
    if (period) {
      params = params.set('startDate', period.start.toISOString());
      params = params.set('endDate', period.end.toISOString());
    }

    return this.http.get<GroupSummary>(`${this.API_URL}/${groupId}/summary`, { params })
      .pipe(
        tap(summary => console.log('Group summary fetched:', summary)),
        catchError(error => this.handleError('Failed to fetch group summary', error))
      );
  }

  /**
   * Bulk create transactions for group
   */
  createBulkTransactions(groupId: number, request: BulkTransactionRequest): Observable<GroupTransaction[]> {
    this.setProcessing(true);
    return this.http.post<GroupTransaction[]>(`${this.API_URL}/${groupId}/transactions/bulk`, request)
      .pipe(
        tap(transactions => {
          console.log('Bulk transactions created:', transactions);
        }),
        catchError(error => this.handleError('Failed to create bulk transactions', error)),
        tap(() => this.setProcessing(false))
      );
  }

  /**
   * Leave group
   */
  leaveGroup(groupId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${groupId}/leave`, { userId })
      .pipe(
        tap(() => {
          // Remove group from user's groups
          this.invalidateUserGroupsCache();
          this.groupCache.delete(groupId);
          
          // Clear active group if user left it
          const activeGroup = this.activeGroupSubject.value;
          if (activeGroup && activeGroup.id === groupId) {
            this.activeGroupSubject.next(null);
          }
          
          console.log('Left group successfully:', groupId);
        }),
        catchError(error => this.handleError('Failed to leave group', error))
      );
  }

  /**
   * Check user permissions for group actions
   */
  checkPermission(groupId: number, userId: number, permission: GroupPermission): Observable<boolean> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('permission', permission);

    return this.http.get<{ hasPermission: boolean }>(
      `${this.API_URL}/${groupId}/permissions`, 
      { params }
    )
      .pipe(
        map(response => response.hasPermission),
        catchError(error => {
          console.error('Permission check failed:', error);
          return of(false);
        })
      );
  }

  /**
   * Set active group for the session
   */
  setActiveGroup(group: Group | null): void {
    this.activeGroupSubject.next(group);
  }

  /**
   * Get cached group (synchronous)
   */
  getCachedGroup(groupId: number): Group | null {
    return this.groupCache.get(groupId) || null;
  }

  // Private helper methods

  private validateGroupData(groupData: CreateGroupRequest): string | null {
    if (!groupData.name?.trim()) {
      return 'Group name is required';
    }
    
    if (groupData.name.length > 100) {
      return 'Group name must be less than 100 characters';
    }
    
    if (groupData.description && groupData.description.length > 500) {
      return 'Group description must be less than 500 characters';
    }
    
    return null;
  }

  private invalidateUserGroupsCache(): void {
    this.userGroupsCache.clear();
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setProcessing(processing: boolean): void {
    this.processingSubject.next(processing);
  }

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);
    
    let userMessage = message;
    if (error.status === 404) {
      userMessage = 'Group not found';
    } else if (error.status === 403) {
      userMessage = 'Access denied. You may not have permission for this action.';
    } else if (error.status === 409) {
      userMessage = 'Conflict. The group may have been modified by another user.';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }

    return throwError(() => new Error(userMessage));
  }

  /**
   * Clear all caches (useful for logout)
   */
  clearCache(): void {
    this.groupCache.clear();
    this.userGroupsCache.clear();
    this.groupMembersCache.clear();
    this.userGroupsSubject.next([]);
    this.activeGroupSubject.next(null);
    console.log('Group service cache cleared');
  }
}