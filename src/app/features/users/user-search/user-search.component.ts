import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="user-search-container">
      <div class="search-header">
        <h1>Find Users</h1>
        <p>Search for other users to split expenses with</p>
      </div>

      <mat-card class="search-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>search</mat-icon>
            Search Users
          </mat-card-title>
          <mat-card-subtitle>Enter an email address to find users</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="searchForm" class="search-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input 
                matInput 
                type="email" 
                formControlName="email"
                placeholder="Enter email to search..."
                autocomplete="off">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>
          </form>

          <!-- Loading State -->
          <div *ngIf="searching" class="loading-state">
            <mat-spinner diameter="30"></mat-spinner>
            <span>Searching...</span>
          </div>

          <!-- Search Results -->
          <div *ngIf="searchResults.length > 0 && !searching" class="search-results">
            <h3>Search Results</h3>
            <mat-list>
              <mat-list-item *ngFor="let user of searchResults" class="user-item">
                <div class="user-avatar" matListIcon>
                  {{ getUserInitials(user.name) }}
                </div>
                
                <div matLine class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                
                <div class="user-actions">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    (click)="onAddUser(user)"
                    [disabled]="isUserAdded(user.id)">
                    <mat-icon>{{ isUserAdded(user.id) ? 'check' : 'person_add' }}</mat-icon>
                    {{ isUserAdded(user.id) ? 'Added' : 'Add User' }}
                  </button>
                </div>
              </mat-list-item>
            </mat-list>
          </div>

          <!-- No Results -->
          <div *ngIf="searchPerformed && searchResults.length === 0 && !searching" class="no-results">
            <mat-icon class="no-results-icon">person_search</mat-icon>
            <h3>No users found</h3>
            <p>No users found with the email "{{ lastSearchTerm }}". Make sure the email is correct.</p>
          </div>

          <!-- Added Users -->
          <div *ngIf="addedUsers.length > 0" class="added-users">
            <h3>Added Users</h3>
            <div class="user-chips">
              <mat-chip-set>
                <mat-chip 
                  *ngFor="let user of addedUsers" 
                  [removable]="true"
                  (removed)="onRemoveUser(user.id)">
                  <div class="chip-avatar">{{ getUserInitials(user.name) }}</div>
                  {{ user.name }}
                  <mat-icon matChipRemove>cancel</mat-icon>
                </mat-chip>
              </mat-chip-set>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Quick Actions -->
      <mat-card class="actions-card" *ngIf="addedUsers.length > 0">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>flash_on</mat-icon>
            Quick Actions
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="onCreateExpense()">
              <mat-icon>add_circle</mat-icon>
              Create Expense with Selected Users
            </button>
            <button mat-stroked-button (click)="onClearAll()">
              <mat-icon>clear_all</mat-icon>
              Clear All
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-search-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .search-header {
      margin-bottom: 2rem;
      text-align: center;

      h1 {
        font-size: 2rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: #666;
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .search-card, .actions-card {
      margin-bottom: 2rem;

      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }
      }
    }

    .search-form {
      margin-bottom: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: #666;
    }

    .search-results {
      margin-top: 1rem;

      h3 {
        color: #333;
        font-weight: 600;
        margin: 0 0 1rem 0;
      }
    }

    .user-item {
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .user-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 1.1rem;
        margin-right: 1rem;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .user-name {
          font-weight: 500;
          color: #333;
          font-size: 1rem;
        }

        .user-email {
          color: #666;
          font-size: 0.9rem;
        }
      }

      .user-actions {
        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      }
    }

    .no-results {
      text-align: center;
      padding: 3rem 1rem;

      .no-results-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #ccc;
        margin-bottom: 1rem;
      }

      h3 {
        color: #666;
        margin: 0 0 0.5rem 0;
        font-weight: 500;
      }

      p {
        color: #999;
        margin: 0;
      }
    }

    .added-users {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #f0f0f0;

      h3 {
        color: #333;
        font-weight: 600;
        margin: 0 0 1rem 0;
      }

      .user-chips {
        .chip-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.7rem;
          margin-right: 0.5rem;
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        flex-direction: column;
      }

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    @media (max-width: 768px) {
      .user-search-container {
        padding: 0.5rem;
      }

      .search-header h1 {
        font-size: 1.5rem;
      }

      .user-item {
        .user-actions {
          margin-top: 0.5rem;
        }
      }
    }
  `]
})
export class UserSearchComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  searchResults: User[] = [];
  addedUsers: User[] = [];
  searching = false;
  searchPerformed = false;
  lastSearchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService
  ) {
    this.searchForm = this.formBuilder.group({
      email: ['']
    });
  }

  ngOnInit(): void {
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => {
          if (!email || email.length < 3) {
            this.searchResults = [];
            this.searchPerformed = false;
            return [];
          }

          this.searching = true;
          this.lastSearchTerm = email;
          return this.userService.searchUsersByEmail(email);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.searching = false;
          this.searchPerformed = true;
          this.searchResults = response.users || [];
        },
        error: (error) => {
          this.searching = false;
          this.searchPerformed = true;
          this.searchResults = [];
          console.error('Search failed:', error);
        }
      });
  }

  onAddUser(user: User): void {
    if (!this.isUserAdded(user.id)) {
      this.addedUsers.push(user);
    }
  }

  onRemoveUser(userId: number): void {
    this.addedUsers = this.addedUsers.filter(user => user.id !== userId);
  }

  isUserAdded(userId: number): boolean {
    return this.addedUsers.some(user => user.id === userId);
  }

  onCreateExpense(): void {
    // Navigate to create expense with selected users
    // This will be implemented when we create the transaction component
    console.log('Create expense with users:', this.addedUsers);
  }

  onClearAll(): void {
    this.addedUsers = [];
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }
}