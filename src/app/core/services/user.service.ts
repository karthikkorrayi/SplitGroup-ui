import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, UserProfile, SearchUsersResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:8082/api/users'; // User microservice

  constructor(private http: HttpClient) {}

  // GET /api/users/search?email={email} - Search users by email
  searchUsersByEmail(email: string): Observable<SearchUsersResponse> {
    return this.http.get<User[]>(`${this.API_URL}/search`, {
      params: { email }
    }).pipe(
      map(users => ({
        users: users,
        total: users.length
      })),
      catchError(error => {
        console.error('User search failed:', error);
        return of({ users: [], total: 0 });
      })
    );
  }

  // GET /api/users/search?name={name} - Search users by name
  searchUsersByName(name: string): Observable<SearchUsersResponse> {
    return this.http.get<User[]>(`${this.API_URL}/search`, {
      params: { name }
    }).pipe(
      map(users => ({
        users: users,
        total: users.length
      })),
      catchError(error => {
        console.error('User search failed:', error);
        return of({ users: [], total: 0 });
      })
    );
  }

  // GET /api/users/search?query={query} - Search users by email or name
  searchUsers(query: string): Observable<SearchUsersResponse> {
    return this.http.get<User[]>(`${this.API_URL}/search`, {
      params: { query }
    }).pipe(
      map(users => ({
        users: users,
        total: users.length
      })),
      catchError(error => {
        console.error('User search failed:', error);
        return of({ users: [], total: 0 });
      })
    );
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