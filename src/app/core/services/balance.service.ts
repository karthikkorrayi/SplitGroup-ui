import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Balance, 
  UserBalance, 
  Settlement, 
  CreateSettlementRequest,
  BalanceOptimization,
  DebtSimplification,
  BalanceSummary,
  SettlementHistory,
  PaymentMethod
} from '../../shared/models/balance.model';

/**
 * BalanceService - Comprehensive debt tracking and settlement service
 * 
 * This service handles all balance-related operations including:
 * - Balance calculations between users
 * - Settlement creation and management
 * - Balance optimization algorithms
 * - Payment tracking and history
 * - Debt simplification suggestions
 * - Multi-currency support foundation
 */
@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private readonly API_URL = `${environment.apiUrl}/balances`;
  
  // Cache management
  private balanceCache = new Map<string, Balance>();
  private userBalanceCache = new Map<number, UserBalance>();
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private processingSettlementSubject = new BehaviorSubject<boolean>(false);
  public processingSettlement$ = this.processingSettlementSubject.asObservable();
  
  // Real-time balance updates
  private balancesSubject = new BehaviorSubject<UserBalance | null>(null);
  public balances$ = this.balancesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get balance between two users with caching
   */
  getBalanceBetweenUsers(userId1: number, userId2: number, forceRefresh = false): Observable<Balance> {
    const cacheKey = `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
    
    // Check cache first
    if (!forceRefresh && this.balanceCache.has(cacheKey)) {
      return of(this.balanceCache.get(cacheKey)!);
    }

    this.setLoading(true);
    return this.http.get<Balance>(`${this.API_URL}/${userId1}/${userId2}`)
      .pipe(
        tap(balance => {
          this.balanceCache.set(cacheKey, balance);
          console.log('Balance fetched between users:', balance);
        }),
        catchError(error => this.handleError('Failed to fetch balance', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get comprehensive user balances with all relationships
   */
  getUserBalances(userId: number, forceRefresh = false): Observable<UserBalance> {
    // Check cache first
    if (!forceRefresh && this.userBalanceCache.has(userId)) {
      return of(this.userBalanceCache.get(userId)!);
    }

    this.setLoading(true);
    return this.http.get<UserBalance>(`${this.API_URL}/user/${userId}`)
      .pipe(
        tap(userBalance => {
          this.userBalanceCache.set(userId, userBalance);
          this.balancesSubject.next(userBalance);
          console.log('User balances fetched:', userBalance);
        }),
        catchError(error => this.handleError('Failed to fetch user balances', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Create a settlement with comprehensive validation
   */
  createSettlement(settlement: CreateSettlementRequest): Observable<Settlement> {
    // Validate settlement request
    const validationError = this.validateSettlement(settlement);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    this.setProcessingSettlement(true);
    return this.http.post<Settlement>(`${this.API_URL}/settle`, settlement)
      .pipe(
        tap(createdSettlement => {
          // Invalidate relevant caches
          this.invalidateBalanceCaches(settlement.fromUserId, settlement.toUserId);
          console.log('Settlement created successfully:', createdSettlement);
        }),
        catchError(error => this.handleError('Failed to create settlement', error)),
        tap(() => this.setProcessingSettlement(false))
      );
  }

  /**
   * Get user settlements with filtering and pagination
   */
  getUserSettlements(userId: number): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.API_URL}/settlements/user/${userId}`)
      .pipe(
        tap(settlements => console.log('User settlements fetched:', settlements)),
        catchError(error => this.handleError('Failed to fetch settlements', error))
      );
  }

  /**
   * Get balance optimization suggestions
   * This helps users minimize the number of transactions needed to settle all debts
   */
  getBalanceOptimization(userId: number): Observable<BalanceOptimization> {
    return this.http.get<BalanceOptimization>(`${this.API_URL}/optimize/${userId}`)
      .pipe(
        tap(optimization => console.log('Balance optimization calculated:', optimization)),
        catchError(error => this.handleError('Failed to get balance optimization', error))
      );
  }

  /**
   * Apply debt simplification
   * This reduces the number of debts by consolidating them optimally
   */
  applyDebtSimplification(userId: number, simplification: DebtSimplification): Observable<UserBalance> {
    this.setProcessingSettlement(true);
    return this.http.post<UserBalance>(`${this.API_URL}/simplify`, {
      userId,
      ...simplification
    })
      .pipe(
        tap(updatedBalance => {
          // Update cache with new simplified balances
          this.userBalanceCache.set(userId, updatedBalance);
          this.balancesSubject.next(updatedBalance);
          this.clearBalanceCache(); // Clear all balance caches as relationships changed
          console.log('Debt simplification applied:', updatedBalance);
        }),
        catchError(error => this.handleError('Failed to apply debt simplification', error)),
        tap(() => this.setProcessingSettlement(false))
      );
  }

  /**
   * Update settlement status (confirm, cancel, etc.)
   */
  updateSettlementStatus(settlementId: number, status: SettlementStatus, notes?: string): Observable<Settlement> {
    const request = { status, notes };
    
    this.setProcessingSettlement(true);
    return this.http.put<Settlement>(`${this.API_URL}/settlements/${settlementId}`, request)
      .pipe(
        tap(updatedSettlement => {
          // Invalidate balance caches as settlement status affects balances
          this.invalidateBalanceCaches(updatedSettlement.fromUserId, updatedSettlement.toUserId);
          console.log('Settlement status updated:', updatedSettlement);
        }),
        catchError(error => this.handleError('Failed to update settlement status', error)),
        tap(() => this.setProcessingSettlement(false))
      );
  }

  /**
   * Get settlement history with detailed information
   */
  getSettlementHistory(userId: number, limit = 50): Observable<SettlementHistory> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<SettlementHistory>(`${this.API_URL}/settlements/history/${userId}`, { params })
      .pipe(
        tap(history => console.log('Settlement history fetched:', history)),
        catchError(error => this.handleError('Failed to fetch settlement history', error))
      );
  }

  /**
   * Get balance summary with analytics
   */
  getBalanceSummary(userId: number, period?: { start: Date; end: Date }): Observable<BalanceSummary> {
    let params = new HttpParams();
    
    if (period) {
      params = params.set('startDate', period.start.toISOString());
      params = params.set('endDate', period.end.toISOString());
    }

    return this.http.get<BalanceSummary>(`${this.API_URL}/summary/${userId}`, { params })
      .pipe(
        tap(summary => console.log('Balance summary fetched:', summary)),
        catchError(error => this.handleError('Failed to fetch balance summary', error))
      );
  }

  /**
   * Calculate optimal settlement path
   * This finds the most efficient way to settle debts with minimum transactions
   */
  calculateOptimalSettlement(userIds: number[]): Observable<Settlement[]> {
    const request = { userIds };
    
    return this.http.post<Settlement[]>(`${this.API_URL}/calculate-optimal`, request)
      .pipe(
        tap(settlements => console.log('Optimal settlement calculated:', settlements)),
        catchError(error => this.handleError('Failed to calculate optimal settlement', error))
      );
  }

  /**
   * Get available payment methods for settlements
   */
  getPaymentMethods(userId: number): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.API_URL}/payment-methods/${userId}`)
      .pipe(
        tap(methods => console.log('Payment methods fetched:', methods)),
        catchError(error => this.handleError('Failed to fetch payment methods', error))
      );
  }

  /**
   * Process settlement with payment method
   */
  processSettlementPayment(settlementId: number, paymentMethodId: string, amount: number): Observable<Settlement> {
    const request = {
      paymentMethodId,
      amount,
      timestamp: new Date()
    };

    this.setProcessingSettlement(true);
    return this.http.post<Settlement>(`${this.API_URL}/settlements/${settlementId}/pay`, request)
      .pipe(
        tap(processedSettlement => {
          // Update caches
          this.invalidateBalanceCaches(processedSettlement.fromUserId, processedSettlement.toUserId);
          console.log('Settlement payment processed:', processedSettlement);
        }),
        catchError(error => this.handleError('Failed to process settlement payment', error)),
        tap(() => this.setProcessingSettlement(false))
      );
  }

  /**
   * Get balance trends and analytics
   */
  getBalanceTrends(userId: number, months = 12): Observable<BalanceTrend[]> {
    const params = new HttpParams().set('months', months.toString());
    
    return this.http.get<BalanceTrend[]>(`${this.API_URL}/trends/${userId}`, { params })
      .pipe(
        tap(trends => console.log('Balance trends fetched:', trends)),
        catchError(error => this.handleError('Failed to fetch balance trends', error))
      );
  }

  /**
   * Send settlement reminder
   */
  sendSettlementReminder(settlementId: number, message?: string): Observable<void> {
    const request = { message };
    
    return this.http.post<void>(`${this.API_URL}/settlements/${settlementId}/remind`, request)
      .pipe(
        tap(() => console.log('Settlement reminder sent:', settlementId)),
        catchError(error => this.handleError('Failed to send settlement reminder', error))
      );
  }

  // Private helper methods

  private validateSettlement(settlement: CreateSettlementRequest): string | null {
    if (settlement.amount <= 0) {
      return 'Settlement amount must be greater than 0';
    }
    
    if (settlement.fromUserId === settlement.toUserId) {
      return 'Cannot create settlement with the same user';
    }
    
    if (!settlement.description?.trim()) {
      return 'Settlement description is required';
    }
    
    return null;
  }

  private invalidateBalanceCaches(userId1: number, userId2: number): void {
    // Clear specific balance cache
    const cacheKey = `${Math.min(userId1, userId2)}-${Math.max(userId1, userId2)}`;
    this.balanceCache.delete(cacheKey);
    
    // Clear user balance caches
    this.userBalanceCache.delete(userId1);
    this.userBalanceCache.delete(userId2);
    
    // Refresh current user balances if affected
    const currentBalance = this.balancesSubject.value;
    if (currentBalance && (currentBalance.userId === userId1 || currentBalance.userId === userId2)) {
      this.getUserBalances(currentBalance.userId, true).subscribe();
    }
  }

  private clearBalanceCache(): void {
    this.balanceCache.clear();
    this.userBalanceCache.clear();
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setProcessingSettlement(processing: boolean): void {
    this.processingSettlementSubject.next(processing);
  }

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);
    
    let userMessage = message;
    if (error.status === 404) {
      userMessage = 'Balance information not found';
    } else if (error.status === 403) {
      userMessage = 'Access denied';
    } else if (error.status === 409) {
      userMessage = 'Settlement conflict. Please refresh and try again.';
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
    this.clearBalanceCache();
    this.balancesSubject.next(null);
    console.log('Balance service cache cleared');
  }
}