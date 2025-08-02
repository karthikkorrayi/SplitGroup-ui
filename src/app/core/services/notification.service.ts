import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, interval, EMPTY } from 'rxjs';
import { tap, catchError, switchMap, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Notification,
  NotificationPreferences,
  NotificationFilter,
  NotificationSummary,
  PushSubscription,
  NotificationTemplate,
  NotificationChannel,
  NotificationBatch
} from '../../shared/models/notification.model';

/**
 * NotificationService - Comprehensive user communications service
 * 
 * This service handles all notification-related operations including:
 * - Real-time notifications for expenses and settlements
 * - Push notification support
 * - Email notification preferences
 * - Notification history and management
 * - Notification templates and customization
 * - Batch notification processing
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  
  // Real-time notification state
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Push notification support
  private pushSubscriptionSubject = new BehaviorSubject<PushSubscription | null>(null);
  public pushSubscription$ = this.pushSubscriptionSubject.asObservable();
  
  // Notification preferences
  private preferencesSubject = new BehaviorSubject<NotificationPreferences | null>(null);
  public preferences$ = this.preferencesSubject.asObservable();
  
  // Polling for real-time updates
  private pollingInterval = 30000; // 30 seconds
  private isPolling = false;

  constructor(private http: HttpClient) {
    this.initializePushNotifications();
  }

  /**
   * Get user notifications with filtering and pagination
   */
  getUserNotifications(
    userId: number, 
    filter?: NotificationFilter
  ): Observable<{ notifications: Notification[]; total: number }> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.page !== undefined) params = params.set('page', filter.page.toString());
      if (filter.size !== undefined) params = params.set('size', filter.size.toString());
      if (filter.unreadOnly) params = params.set('unreadOnly', 'true');
      if (filter.type) params = params.set('type', filter.type);
      if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
      if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
    }

    this.setLoading(true);
    return this.http.get<{ notifications: Notification[]; total: number }>(
      `${this.API_URL}/user/${userId}`, 
      { params }
    )
      .pipe(
        tap(response => {
          // Update state if this is the first page
          if (!filter?.page || filter.page === 0) {
            this.notificationsSubject.next(response.notifications);
            this.updateUnreadCount(response.notifications);
          }
          
          console.log('User notifications fetched:', response);
        }),
        catchError(error => this.handleError('Failed to fetch notifications', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/mark-read/${notificationId}`, {})
      .pipe(
        tap(() => {
          // Update local state
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(n => 
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          );
          this.notificationsSubject.next(updatedNotifications);
          this.updateUnreadCount(updatedNotifications);
          
          console.log('Notification marked as read:', notificationId);
        }),
        catchError(error => this.handleError('Failed to mark notification as read', error))
      );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/mark-all-read`, { userId })
      .pipe(
        tap(() => {
          // Update local state
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(n => ({ 
            ...n, 
            isRead: true, 
            readAt: new Date() 
          }));
          this.notificationsSubject.next(updatedNotifications);
          this.unreadCountSubject.next(0);
          
          console.log('All notifications marked as read');
        }),
        catchError(error => this.handleError('Failed to mark all notifications as read', error))
      );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${notificationId}`)
      .pipe(
        tap(() => {
          // Update local state
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
          this.notificationsSubject.next(updatedNotifications);
          this.updateUnreadCount(updatedNotifications);
          
          console.log('Notification deleted:', notificationId);
        }),
        catchError(error => this.handleError('Failed to delete notification', error))
      );
  }

  /**
   * Get notification preferences
   */
  getNotificationPreferences(userId: number): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.API_URL}/preferences/${userId}`)
      .pipe(
        tap(preferences => {
          this.preferencesSubject.next(preferences);
          console.log('Notification preferences fetched:', preferences);
        }),
        catchError(error => this.handleError('Failed to fetch notification preferences', error))
      );
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(
    userId: number, 
    preferences: Partial<NotificationPreferences>
  ): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.API_URL}/preferences/${userId}`, preferences)
      .pipe(
        tap(updatedPreferences => {
          this.preferencesSubject.next(updatedPreferences);
          
          // Update push subscription based on preferences
          if (!updatedPreferences.pushNotifications && this.pushSubscriptionSubject.value) {
            this.unsubscribeFromPush();
          } else if (updatedPreferences.pushNotifications && !this.pushSubscriptionSubject.value) {
            this.subscribeToPush(userId);
          }
          
          console.log('Notification preferences updated:', updatedPreferences);
        }),
        catchError(error => this.handleError('Failed to update notification preferences', error))
      );
  }

  /**
   * Send test notification
   */
  sendTestNotification(userId: number, channel: NotificationChannel): Observable<void> {
    const request = { userId, channel };
    
    return this.http.post<void>(`${this.API_URL}/test`, request)
      .pipe(
        tap(() => console.log('Test notification sent:', channel)),
        catchError(error => this.handleError('Failed to send test notification', error))
      );
  }

  /**
   * Get notification summary/statistics
   */
  getNotificationSummary(userId: number, days = 30): Observable<NotificationSummary> {
    const params = new HttpParams().set('days', days.toString());
    
    return this.http.get<NotificationSummary>(`${this.API_URL}/summary/${userId}`, { params })
      .pipe(
        tap(summary => console.log('Notification summary fetched:', summary)),
        catchError(error => this.handleError('Failed to fetch notification summary', error))
      );
  }

  /**
   * Subscribe to push notifications
   */
  subscribeToPush(userId: number): Observable<PushSubscription> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return throwError(() => new Error('Push notifications are not supported in this browser'));
    }

    return new Observable(observer => {
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(environment.vapidPublicKey || '')
        });
      })
      .then(subscription => {
        // Send subscription to server
        const pushSub: PushSubscription = {
          userId,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
          },
          isActive: true,
          createdAt: new Date()
        };

        this.http.post<PushSubscription>(`${this.API_URL}/push/subscribe`, pushSub)
          .subscribe({
            next: (savedSubscription) => {
              this.pushSubscriptionSubject.next(savedSubscription);
              observer.next(savedSubscription);
              observer.complete();
              console.log('Push notification subscription created:', savedSubscription);
            },
            error: (error) => {
              observer.error(error);
            }
          });
      })
      .catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Unsubscribe from push notifications
   */
  unsubscribeFromPush(): Observable<void> {
    const currentSubscription = this.pushSubscriptionSubject.value;
    if (!currentSubscription) {
      return EMPTY;
    }

    return this.http.delete<void>(`${this.API_URL}/push/unsubscribe/${currentSubscription.id}`)
      .pipe(
        tap(() => {
          this.pushSubscriptionSubject.next(null);
          console.log('Push notification subscription removed');
        }),
        catchError(error => this.handleError('Failed to unsubscribe from push notifications', error))
      );
  }

  /**
   * Start real-time polling for notifications
   */
  startPolling(userId: number): void {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    interval(this.pollingInterval)
      .pipe(
        filter(() => this.isPolling),
        switchMap(() => this.getUserNotifications(userId, { page: 0, size: 20, unreadOnly: false }))
      )
      .subscribe({
        next: (response) => {
          // Only update if there are new notifications
          const currentNotifications = this.notificationsSubject.value;
          if (response.notifications.length > 0 && 
              (!currentNotifications.length || 
               response.notifications[0].id !== currentNotifications[0].id)) {
            this.notificationsSubject.next(response.notifications);
            this.updateUnreadCount(response.notifications);
          }
        },
        error: (error) => {
          console.error('Notification polling error:', error);
        }
      });

    console.log('Notification polling started');
  }

  /**
   * Stop real-time polling
   */
  stopPolling(): void {
    this.isPolling = false;
    console.log('Notification polling stopped');
  }

  /**
   * Get notification templates for customization
   */
  getNotificationTemplates(): Observable<NotificationTemplate[]> {
    return this.http.get<NotificationTemplate[]>(`${this.API_URL}/templates`)
      .pipe(
        tap(templates => console.log('Notification templates fetched:', templates)),
        catchError(error => this.handleError('Failed to fetch notification templates', error))
      );
  }

  /**
   * Process batch notifications (admin feature)
   */
  processBatchNotifications(batch: NotificationBatch): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/batch`, batch)
      .pipe(
        tap(() => console.log('Batch notifications processed:', batch)),
        catchError(error => this.handleError('Failed to process batch notifications', error))
      );
  }

  /**
   * Show browser notification (if permissions granted)
   */
  showBrowserNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        ...options
      });
    }
  }

  /**
   * Request notification permissions
   */
  requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.reject('Notifications not supported');
    }

    return Notification.requestPermission();
  }

  // Private helper methods

  private initializePushNotifications(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);
    
    let userMessage = message;
    if (error.status === 404) {
      userMessage = 'Notification not found';
    } else if (error.status === 403) {
      userMessage = 'Access denied';
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      userMessage = error.error.message;
    }

    return throwError(() => new Error(userMessage));
  }

  /**
   * Clear all notification data (useful for logout)
   */
  clearNotifications(): void {
    this.stopPolling();
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.preferencesSubject.next(null);
    this.pushSubscriptionSubject.next(null);
    console.log('Notification service cleared');
  }
}