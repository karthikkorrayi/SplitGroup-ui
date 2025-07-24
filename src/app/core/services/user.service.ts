import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUserProfile(userId: number): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/profiles/${userId}`);
  }

  updateUserProfile(userId: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/profiles/${userId}`, userData);
  }

  searchUsersByEmail(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users/search/email?q=${query}`);
  }
}