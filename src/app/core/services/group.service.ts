import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  createdByName: string;
  createdAt: Date;
  members: GroupMember[];
  totalExpenses: number;
  memberCount: number;
}

export interface GroupMember {
  userId: number;
  userName: string;
  userEmail: string;
  joinedAt: Date;
  isAdmin: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  memberIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly API_URL = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  // GET /api/groups
  getUserGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.API_URL);
  }

  // POST /api/groups
  createGroup(group: CreateGroupRequest): Observable<Group> {
    return this.http.post<Group>(this.API_URL, group);
  }

  // GET /api/groups/{id}
  getGroupById(id: number): Observable<Group> {
    return this.http.get<Group>(`${this.API_URL}/${id}`);
  }

  // PUT /api/groups/{id}
  updateGroup(id: number, group: Partial<CreateGroupRequest>): Observable<Group> {
    return this.http.put<Group>(`${this.API_URL}/${id}`, group);
  }

  // DELETE /api/groups/{id}
  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  // POST /api/groups/{id}/members
  addMember(groupId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${groupId}/members`, { userId });
  }

  // DELETE /api/groups/{id}/members/{userId}
  removeMember(groupId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${groupId}/members/${userId}`);
  }
}