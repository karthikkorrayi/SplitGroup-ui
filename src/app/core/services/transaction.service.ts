import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, combineLatest } from 'rxjs';
import { tap, catchError, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Transaction, 
  CreateTransactionRequest, 
  TransactionDetail,
  TransactionFilter,
  TransactionCategory,
  SplitCalculation,
  TransactionParticipant,
  SplitType,
  TransactionStatus,
  PaginatedTransactions,
  TransactionSummary,
  ExportRequest,
  ExportResponse
} from '../../shared/models/transaction.model';

/**
 * TransactionService - Comprehensive expense management service
 * 
 * This service handles all transaction-related operations including:
 * - Transaction creation with multiple split types (Equal, Exact, Percentage)
 * - Transaction history with filtering and pagination
 * - Transaction details with participant information
 * - Transaction editing and deletion
 * - Category management for expenses
 * - Advanced split calculations
 * - Export functionality
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly API_URL = `${environment.apiUrl}/transactions`;
  
  // Cache management
  private transactionCache = new Map<number, TransactionDetail>();
  private categoriesCache: TransactionCategory[] = [];
  private userTransactionsCache = new Map<number, Transaction[]>();
  
  // Loading states
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private savingSubject = new BehaviorSubject<boolean>(false);
  public saving$ = this.savingSubject.asObservable();
  
  // Recent transactions for quick access
  private recentTransactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public recentTransactions$ = this.recentTransactionsSubject.asObservable();
  
  // Transaction summary statistics
  private summarySubject = new BehaviorSubject<TransactionSummary | null>(null);
  public summary$ = this.summarySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  /**
   * Create a new transaction with comprehensive validation and split calculations
   */
  createTransaction(transaction: CreateTransactionRequest): Observable<Transaction> {
    // Validate transaction before sending
    const validationError = this.validateTransaction(transaction);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    // Calculate splits to ensure accuracy
    const calculatedTransaction = this.calculateSplits(transaction);

    this.setSaving(true);
    return this.http.post<Transaction>(this.API_URL, calculatedTransaction)
      .pipe(
        tap(createdTransaction => {
          // Update caches
          this.invalidateUserTransactionsCache();
          this.updateRecentTransactions(createdTransaction);
          this.refreshSummary();
          
          console.log('Transaction created successfully:', createdTransaction);
        }),
        catchError(error => this.handleError('Failed to create transaction', error)),
        tap(() => this.setSaving(false))
      );
  }

  /**
   * Get user transactions with advanced filtering and pagination
   */
  getUserTransactions(
    userId: number, 
    filter?: TransactionFilter, 
    useCache = true
  ): Observable<PaginatedTransactions> {
    // Build query parameters
    let params = new HttpParams();
    
    if (filter) {
      if (filter.page !== undefined) params = params.set('page', filter.page.toString());
      if (filter.size !== undefined) params = params.set('size', filter.size.toString());
      if (filter.startDate) params = params.set('startDate', filter.startDate.toISOString());
      if (filter.endDate) params = params.set('endDate', filter.endDate.toISOString());
      if (filter.category) params = params.set('category', filter.category);
      if (filter.minAmount !== undefined) params = params.set('minAmount', filter.minAmount.toString());
      if (filter.maxAmount !== undefined) params = params.set('maxAmount', filter.maxAmount.toString());
      if (filter.status) params = params.set('status', filter.status);
      if (filter.searchTerm) params = params.set('search', filter.searchTerm);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);
    }

    this.setLoading(true);
    return this.http.get<PaginatedTransactions>(`${this.API_URL}/user/${userId}`, { params })
      .pipe(
        tap(response => {
          // Update recent transactions if this is the first page
          if (!filter?.page || filter.page === 0) {
            this.recentTransactionsSubject.next(response.content.slice(0, 5));
          }
          
          console.log('User transactions fetched:', response);
        }),
        catchError(error => this.handleError('Failed to fetch transactions', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get transaction details with participant information
   */
  getTransactionDetails(id: number, forceRefresh = false): Observable<TransactionDetail> {
    // Check cache first
    if (!forceRefresh && this.transactionCache.has(id)) {
      return of(this.transactionCache.get(id)!);
    }

    this.setLoading(true);
    return this.http.get<TransactionDetail>(`${this.API_URL}/${id}`)
      .pipe(
        tap(transaction => {
          // Update cache
          this.transactionCache.set(id, transaction);
          console.log('Transaction details fetched:', transaction);
        }),
        catchError(error => this.handleError('Failed to fetch transaction details', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Update transaction with optimistic updates
   */
  updateTransaction(id: number, updates: Partial<Transaction>): Observable<Transaction> {
    const cachedTransaction = this.transactionCache.get(id);
    
    // Optimistic update
    if (cachedTransaction) {
      const optimisticTransaction = { ...cachedTransaction, ...updates };
      this.transactionCache.set(id, optimisticTransaction);
    }

    this.setSaving(true);
    return this.http.put<Transaction>(`${this.API_URL}/${id}`, updates)
      .pipe(
        tap(updatedTransaction => {
          // Update cache with server response
          this.transactionCache.set(id, updatedTransaction as TransactionDetail);
          this.invalidateUserTransactionsCache();
          this.refreshSummary();
          
          console.log('Transaction updated successfully:', updatedTransaction);
        }),
        catchError(error => {
          // Revert optimistic update on error
          if (cachedTransaction) {
            this.transactionCache.set(id, cachedTransaction);
          }
          return this.handleError('Failed to update transaction', error);
        }),
        tap(() => this.setSaving(false))
      );
  }

  /**
   * Delete transaction with confirmation
   */
  deleteTransaction(id: number): Observable<void> {
    this.setSaving(true);
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          // Remove from cache
          this.transactionCache.delete(id);
          this.invalidateUserTransactionsCache();
          this.refreshSummary();
          
          console.log('Transaction deleted successfully:', id);
        }),
        catchError(error => this.handleError('Failed to delete transaction', error)),
        tap(() => this.setSaving(false))
      );
  }

  /**
   * Get expense categories with caching
   */
  getCategories(forceRefresh = false): Observable<TransactionCategory[]> {
    if (!forceRefresh && this.categoriesCache.length > 0) {
      return of(this.categoriesCache);
    }

    return this.http.get<TransactionCategory[]>(`${this.API_URL}/categories`)
      .pipe(
        tap(categories => {
          this.categoriesCache = categories;
          console.log('Categories fetched:', categories);
        }),
        catchError(error => this.handleError('Failed to fetch categories', error))
      );
  }

  /**
   * Search transactions with debouncing
   */
  searchTransactions(searchTerm: string, userId: number): Observable<Transaction[]> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', searchTerm)
      .set('userId', userId.toString());

    return this.http.get<Transaction[]>(`${this.API_URL}/search`, { params })
      .pipe(
        catchError(error => this.handleError('Failed to search transactions', error))
      );
  }

  /**
   * Create debounced search observable
   */
  createDebouncedSearch(searchTerm$: Observable<string>, userId: number, debounceMs = 300): Observable<Transaction[]> {
    return searchTerm$.pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      switchMap(term => this.searchTransactions(term, userId))
    );
  }

  /**
   * Calculate splits for different split types
   */
  calculateSplits(transaction: CreateTransactionRequest): CreateTransactionRequest {
    const { amount, splitType, participants } = transaction;
    
    switch (splitType) {
      case SplitType.EQUAL:
        return this.calculateEqualSplit(transaction);
      
      case SplitType.EXACT:
        return this.calculateExactSplit(transaction);
      
      case SplitType.PERCENTAGE:
        return this.calculatePercentageSplit(transaction);
      
      default:
        return transaction;
    }
  }

  /**
   * Get real-time split calculations for UI
   */
  getSplitCalculation(amount: number, splitType: SplitType, participants: TransactionParticipant[]): SplitCalculation {
    const calculation: SplitCalculation = {
      totalAmount: amount,
      splitType,
      participants: [],
      isValid: false,
      errors: []
    };

    switch (splitType) {
      case SplitType.EQUAL:
        calculation.participants = this.calculateEqualSplitAmounts(amount, participants);
        calculation.isValid = true;
        break;
        
      case SplitType.EXACT:
        calculation.participants = participants.map(p => ({ ...p }));
        const exactTotal = participants.reduce((sum, p) => sum + (p.amount || 0), 0);
        calculation.isValid = Math.abs(exactTotal - amount) < 0.01;
        if (!calculation.isValid) {
          calculation.errors.push(`Split amounts (${exactTotal}) don't match total (${amount})`);
        }
        break;
        
      case SplitType.PERCENTAGE:
        calculation.participants = this.calculatePercentageSplitAmounts(amount, participants);
        const percentageTotal = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        calculation.isValid = Math.abs(percentageTotal - 100) < 0.01;
        if (!calculation.isValid) {
          calculation.errors.push(`Percentages (${percentageTotal}%) don't add up to 100%`);
        }
        break;
    }

    return calculation;
  }

  /**
   * Export transactions to various formats
   */
  exportTransactions(request: ExportRequest): Observable<ExportResponse> {
    this.setLoading(true);
    return this.http.post<ExportResponse>(`${this.API_URL}/export`, request)
      .pipe(
        tap(response => console.log('Export completed:', response)),
        catchError(error => this.handleError('Failed to export transactions', error)),
        tap(() => this.setLoading(false))
      );
  }

  /**
   * Get transaction summary statistics
   */
  getTransactionSummary(userId: number, period?: { start: Date; end: Date }): Observable<TransactionSummary> {
    let params = new HttpParams().set('userId', userId.toString());
    
    if (period) {
      params = params.set('startDate', period.start.toISOString());
      params = params.set('endDate', period.end.toISOString());
    }

    return this.http.get<TransactionSummary>(`${this.API_URL}/summary`, { params })
      .pipe(
        tap(summary => {
          this.summarySubject.next(summary);
          console.log('Transaction summary fetched:', summary);
        }),
        catchError(error => this.handleError('Failed to fetch transaction summary', error))
      );
  }

  /**
   * Bulk operations for transactions
   */
  bulkUpdateTransactions(transactionIds: number[], updates: Partial<Transaction>): Observable<Transaction[]> {
    const request = {
      transactionIds,
      updates
    };

    this.setSaving(true);
    return this.http.put<Transaction[]>(`${this.API_URL}/bulk`, request)
      .pipe(
        tap(updatedTransactions => {
          // Update cache
          updatedTransactions.forEach(transaction => {
            this.transactionCache.set(transaction.id, transaction as TransactionDetail);
          });
          this.invalidateUserTransactionsCache();
          
          console.log('Bulk update completed:', updatedTransactions);
        }),
        catchError(error => this.handleError('Failed to bulk update transactions', error)),
        tap(() => this.setSaving(false))
      );
  }

  // Private helper methods

  private calculateEqualSplit(transaction: CreateTransactionRequest): CreateTransactionRequest {
    const { amount, participants } = transaction;
    const splitAmount = amount / participants.length;
    
    return {
      ...transaction,
      participants: participants.map(p => ({
        ...p,
        amount: splitAmount
      }))
    };
  }

  private calculateExactSplit(transaction: CreateTransactionRequest): CreateTransactionRequest {
    // Validation is done in getSplitCalculation
    return transaction;
  }

  private calculatePercentageSplit(transaction: CreateTransactionRequest): CreateTransactionRequest {
    const { amount, participants } = transaction;
    
    return {
      ...transaction,
      participants: participants.map(p => ({
        ...p,
        amount: amount * ((p.percentage || 0) / 100)
      }))
    };
  }

  private calculateEqualSplitAmounts(amount: number, participants: TransactionParticipant[]): TransactionParticipant[] {
    const splitAmount = amount / participants.length;
    return participants.map(p => ({ ...p, amount: splitAmount }));
  }

  private calculatePercentageSplitAmounts(amount: number, participants: TransactionParticipant[]): TransactionParticipant[] {
    return participants.map(p => ({
      ...p,
      amount: amount * ((p.percentage || 0) / 100)
    }));
  }

  private validateTransaction(transaction: CreateTransactionRequest): string | null {
    if (!transaction.description?.trim()) {
      return 'Description is required';
    }
    
    if (transaction.amount <= 0) {
      return 'Amount must be greater than 0';
    }
    
    if (!transaction.participants || transaction.participants.length === 0) {
      return 'At least one participant is required';
    }
    
    if (transaction.splitType === SplitType.EXACT) {
      const total = transaction.participants.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (Math.abs(total - transaction.amount) > 0.01) {
        return 'Split amounts must equal the total amount';
      }
    }
    
    if (transaction.splitType === SplitType.PERCENTAGE) {
      const totalPercentage = transaction.participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return 'Percentages must add up to 100%';
      }
    }
    
    return null;
  }

  private loadCategories(): void {
    this.getCategories().subscribe();
  }

  private updateRecentTransactions(newTransaction: Transaction): void {
    const current = this.recentTransactionsSubject.value;
    const updated = [newTransaction, ...current.slice(0, 4)];
    this.recentTransactionsSubject.next(updated);
  }

  private invalidateUserTransactionsCache(): void {
    this.userTransactionsCache.clear();
  }

  private refreshSummary(): void {
    // This would typically be called with the current user ID
    // Implementation depends on how you track the current user
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setSaving(saving: boolean): void {
    this.savingSubject.next(saving);
  }

  private handleError(message: string, error: HttpErrorResponse): Observable<never> {
    console.error(`${message}:`, error);
    
    let userMessage = message;
    if (error.status === 404) {
      userMessage = 'Transaction not found';
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
   * Clear all caches (useful for logout)
   */
  clearCache(): void {
    this.transactionCache.clear();
    this.userTransactionsCache.clear();
    this.recentTransactionsSubject.next([]);
    this.summarySubject.next(null);
    console.log('Transaction service cache cleared');
  }
}