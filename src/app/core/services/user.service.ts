import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SearchUsersResponse {
  users: User[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // GET /api/users/search?email={email}
  searchUsersByEmail(email: string): Observable<SearchUsersResponse> {
    return this.http.get<SearchUsersResponse>(`${this.API_URL}/search`, {
      params: { email }
    });
  }

  // GET /api/users/{id}
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  // GET /api/users/profile
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`);
  }

  // PUT /api/users/profile
  updateProfile(profile: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/profile`, profile);
  }
}