import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserBalance {
  userId: number;
  userName: string;
  totalOwed: number;    // Money others owe to this user
  totalOwing: number;   // Money this user owes to others
  netBalance: number;   // totalOwed - totalOwing
}

export interface BalanceSummary {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  balances: UserBalance[];
}

export interface Settlement {
  id: number;
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
  description: string;
  settledAt: Date;
}

export interface CreateSettlementRequest {
  toUserId: number;
  amount: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private readonly API_URL = `${environment.apiUrl}/balances`;

  constructor(private http: HttpClient) {}

  // GET /api/balances/summary
  getBalanceSummary(): Observable<BalanceSummary> {
    return this.http.get<BalanceSummary>(`${this.API_URL}/summary`);
  }

  // GET /api/balances/with/{userId}
  getBalanceWithUser(userId: number): Observable<UserBalance> {
    return this.http.get<UserBalance>(`${this.API_URL}/with/${userId}`);
  }

  // POST /api/balances/settle
  createSettlement(settlement: CreateSettlementRequest): Observable<Settlement> {
    return this.http.post<Settlement>(`${this.API_URL}/settle`, settlement);
  }

  // GET /api/balances/settlements
  getSettlements(): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.API_URL}/settlements`);
  }
}