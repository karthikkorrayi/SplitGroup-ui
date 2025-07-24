import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Balance, SettlementRequest } from '../models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  constructor(private http: HttpClient) {}

  getBalanceBetweenUsers(userId1: number, userId2: number): Observable<Balance> {
    return this.http.get<Balance>(`${environment.apiUrl}/balances/${userId1}/${userId2}`);
  }

  getUserBalances(userId: number): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${environment.apiUrl}/balances/user/${userId}`);
  }

  createSettlement(settlement: SettlementRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/balances/settle`, settlement);
  }
}