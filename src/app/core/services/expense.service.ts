import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  paidBy: number;
  paidByName: string;
  groupId?: number;
  groupName?: string;
  createdAt: Date;
  updatedAt?: Date;
  participants: ExpenseParticipant[];
}

export interface ExpenseParticipant {
  userId: number;
  userName: string;
  amount: number;
  settled: boolean;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  category: string;
  groupId?: number;
  participants: {
    userId: number;
    amount: number;
  }[];
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly API_URL = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  // POST /api/expenses
  createExpense(expense: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.API_URL, expense);
  }

  // GET /api/expenses
  getUserExpenses(page: number = 0, size: number = 20): Observable<ExpenseListResponse> {
    return this.http.get<ExpenseListResponse>(this.API_URL, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  // GET /api/expenses/{id}
  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.API_URL}/${id}`);
  }

  // PUT /api/expenses/{id}
  updateExpense(id: number, expense: Partial<CreateExpenseRequest>): Observable<Expense> {
    return this.http.put<Expense>(`${this.API_URL}/${id}`, expense);
  }

  // DELETE /api/expenses/{id}
  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}