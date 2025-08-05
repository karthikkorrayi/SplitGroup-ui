import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile, SearchUsersResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // get user profile by ID
  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profiles/${userId}`);
  }

  // update user profile
  updateUserProfile(userId: number, profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/profiles/${userId}`, profile);
  }

  // search users by email
  searchUsersByEmail(email: string): Observable<SearchUsersResponse> {
    // Mock implementation for demonstration
    const mockUsers = [
      { id: 2, name: 'John Doe', email: 'john@example.com' },
      { id: 3, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 4, name: 'Mike Johnson', email: 'mike@example.com' },
      { id: 5, name: 'Sarah Wilson', email: 'sarah@example.com' }
    ].filter(user => user.email.toLowerCase().includes(email.toLowerCase()));
    
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({ users: mockUsers, total: mockUsers.length });
        observer.complete();
      }, 500);
    });
  }
}