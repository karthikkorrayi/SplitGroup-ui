import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Balance, 
  UserBalance, 
  Settlement, 
  CreateSettlementRequest 
} from '../../shared/models/balance.model';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private readonly API_URL = `${environment.apiUrl}/balances`;

  constructor(private http: HttpClient) {}

  // get balance between two users
  getBalanceBetweenUsers(userId1: number, userId2: number): Observable<Balance> {
    return this.http.get<Balance>(`${this.API_URL}/${userId1}/${userId2}`);
  }

  // get user balances
  getUserBalances(userId: number): Observable<UserBalance> {
    return this.http.get<UserBalance>(`${this.API_URL}/user/${userId}`);
  }

  // create a settlement
  createSettlement(settlement: CreateSettlementRequest): Observable<Settlement> {
    return this.http.post<Settlement>(`${this.API_URL}/settle`, settlement);
  }

  // get user settlements
  getUserSettlements(userId: number): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.API_URL}/settlements/user/${userId}`);
  }
}