import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    console.log('AuthService: Registering user', request.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, request)
      .pipe(
        tap(response => {
          console.log('AuthService: Registration response', response);
          this.handleAuthSuccess(response);
        })
      );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    console.log('AuthService: Logging in user', request.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          console.log('AuthService: Login response', response);
          this.handleAuthSuccess(response);
        })
      );
  }

  logout(): void {
    console.log('AuthService: Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    
    const user: User = {
      id: response.userId,
      email: response.email,
      name: response.name
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    console.log('AuthService: User logged in successfully', user);
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        console.log('AuthService: User loaded from storage', user);
      } catch (error) {
        console.error('AuthService: Error loading user from storage', error);
        this.logout();
      }
    }
  }
}