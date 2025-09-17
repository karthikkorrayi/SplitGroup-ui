import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  paidBy: number;
  paidByName: string;
  participants: TransactionParticipant[];
  createdAt: Date;
  updatedAt?: Date;
  status: 'ACTIVE' | 'SETTLED' | 'CANCELLED';
}

export interface TransactionParticipant {
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  settled: boolean;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  category: string;
  participants: {
    userId: number;
    amount: number;
  }[];
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly API_URL = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  // POST /api/transactions - Create new transaction
  createTransaction(transaction: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.API_URL, transaction)
      .pipe(
        catchError(this.handleError)
      );
  }

  // GET /api/transactions - Get user transactions with pagination
  getUserTransactions(page: number = 0, size: number = 20): Observable<TransactionListResponse> {
    return this.http.get<TransactionListResponse>(this.API_URL, {
      params: { 
        page: page.toString(), 
        size: size.toString() 
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // GET /api/transactions/{id} - Get transaction by ID
  getTransactionById(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // PUT /api/transactions/{id} - Update transaction
  updateTransaction(id: number, transaction: Partial<CreateTransactionRequest>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.API_URL}/${id}`, transaction)
      .pipe(
        catchError(this.handleError)
      );
  }

  // DELETE /api/transactions/{id} - Delete transaction
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // GET /api/transactions/recent - Get recent transactions
  getRecentTransactions(limit: number = 5): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.API_URL}/recent`, {
      params: { limit: limit.toString() }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Transaction service error:', error);
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status === 401) {
      errorMessage = 'You are not authorized to perform this action.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. Please contact support.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}