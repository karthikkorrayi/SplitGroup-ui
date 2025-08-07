import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserProfile, SearchUsersResponse } from '../../shared/models/user.model';

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
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profile`);
  }

  // GET /api/users/{id}/profile
  getUserProfile(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/${id}/profile`);
  }

  // PUT /api/users/profile
  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/profile`, profile);
  }

  // PUT /api/users/{id}/profile
  updateUserProfile(id: number, profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/${id}/profile`, profile);
  }
}