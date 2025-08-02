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
    return this.http.get<SearchUsersResponse>(`${this.API_URL}/search/email`, {
      params: { q: email }
    });
  }
}