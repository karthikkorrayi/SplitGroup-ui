import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Transaction, 
  CreateTransactionRequest, 
  TransactionDetail 
} from '../../shared/models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly API_URL = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  // create a new transaction
  createTransaction(transaction: CreateTransactionRequest): Observable<Transaction> {
    // Mock implementation for demonstration
    const mockTransaction: Transaction = {
      id: Math.floor(Math.random() * 1000),
      paidBy: 1, // Current user
      paidByName: 'You',
      owedBy: transaction.participants[0]?.userId || 2,
      owedByName: 'John Doe',
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      totalAmount: transaction.amount,
      status: 'ACTIVE' as any,
      splitType: transaction.splitType,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(mockTransaction);
        observer.complete();
      }, 1000);
    });
  }

  // get user transactions
  getUserTransactions(userId: number): Observable<Transaction[]> {
    // Mock implementation for demonstration
    const mockTransactions: Transaction[] = [
      {
        id: 1,
        paidBy: 1,
        paidByName: 'You',
        owedBy: 2,
        owedByName: 'John Doe',
        amount: 25.50,
        description: 'Lunch at restaurant',
        category: 'Food',
        totalAmount: 51.00,
        status: 'ACTIVE' as any,
        splitType: 'EQUAL' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        paidBy: 2,
        paidByName: 'Jane Smith',
        owedBy: 1,
        owedByName: 'You',
        amount: 15.75,
        description: 'Coffee and snacks',
        category: 'Food',
        totalAmount: 31.50,
        status: 'ACTIVE' as any,
        splitType: 'EQUAL' as any,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(mockTransactions);
        observer.complete();
      }, 500);
    });
  }

  // get transaction
  getTransactionDetails(id: number): Observable<TransactionDetail> {
    return this.http.get<TransactionDetail>(`${this.API_URL}/${id}`);
  }

  // update transaction
  updateTransaction(id: number, transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.API_URL}/${id}`, transaction);
  }

  // delete transaction
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}