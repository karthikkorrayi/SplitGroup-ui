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
    return this.http.post<Transaction>(this.API_URL, transaction);
  }

  // get user transactions
  getUserTransactions(userId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.API_URL}/user/${userId}`);
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