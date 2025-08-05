import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <mat-card class="header-card">
        <mat-card-header>
          <div class="header-content">
            <div class="header-left">
              <mat-icon class="app-icon">account_balance_wallet</mat-icon>
              <div class="app-info">
                <h1 class="app-title">SplitGroup</h1>
                <p class="app-subtitle">Expense Management</p>
              </div>
            </div>
            
            <div class="header-right">
              <!-- User Menu -->
              <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
                <div class="user-avatar">
                  {{ getUserInitials() }}
                </div>
                <span class="user-name">{{ (currentUser$ | async)?.name || 'User' }}</span>
                <mat-icon>arrow_drop_down</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-header>
      </mat-card>

      <!-- Welcome Section -->
      <mat-card class="welcome-card">
        <mat-card-content>
          <div class="welcome-content">
            <div class="welcome-text">
              <h2>{{ getGreeting() }}, {{ getFirstName() }}! 👋</h2>
              <p>Welcome to your expense management dashboard. Here's what's happening with your finances.</p>
            </div>
            <div class="welcome-actions">
              <button mat-raised-button color="primary">
                <mat-icon>add_circle</mat-icon>
                Add Expense
              </button>
              <button mat-stroked-button color="accent">
                <mat-icon>group_add</mat-icon>
                Create Group
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card positive">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">trending_up</mat-icon>
              <div class="stat-info">
                <h3>$0.00</h3>
                <p>You are owed</p>
                <small>Money coming to you</small>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card negative">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">trending_down</mat-icon>
              <div class="stat-info">
                <h3>$0.00</h3>
                <p>You owe</p>
                <small>Money you need to pay</small>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card neutral">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">account_balance</mat-icon>
              <div class="stat-info">
                <h3>$0.00</h3>
                <p>Net balance</p>
                <small>Your overall position</small>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card accent">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">receipt_long</mat-icon>
              <div class="stat-info">
                <h3>0</h3>
                <p>Transactions</p>
                <small>This month</small>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Status Card -->
      <mat-card class="status-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>checklist</mat-icon>
            Authentication Status
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="status-list">
            <div class="status-item completed">
              <mat-icon>check_circle</mat-icon>
              <span>✅ User authentication working</span>
            </div>
            <div class="status-item completed">
              <mat-icon>check_circle</mat-icon>
              <span>✅ JWT token management active</span>
            </div>
            <div class="status-item completed">
              <mat-icon>check_circle</mat-icon>
              <span>✅ Backend integration ready</span>
            </div>
            <div class="status-item completed">
              <mat-icon>check_circle</mat-icon>
              <span>✅ Dashboard fully functional</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <div class="user-info">
        <div class="user-avatar-large">
          {{ getUserInitials() }}
        </div>
        <div class="user-details">
          <div class="user-name">{{ (currentUser$ | async)?.name }}</div>
          <div class="user-email">{{ (currentUser$ | async)?.email }}</div>
        </div>
      </div>
      <mat-divider></mat-divider>
      
      <button mat-menu-item>
        <mat-icon>person</mat-icon>
        <span>Profile Settings</span>
      </button>
      
      <button mat-menu-item>
        <mat-icon>help</mat-icon>
        <span>Help & Support</span>
      </button>
      
      <mat-divider></mat-divider>
      
      <button mat-menu-item (click)="logout()" class="logout-btn">
        <mat-icon>exit_to_app</mat-icon>
        <span>Logout</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .dashboard-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .header-card {
      margin-bottom: 1rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .app-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #3f51b5;
    }

    .app-info {
      .app-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #333;
      }
      
      .app-subtitle {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      background-color: rgba(63, 81, 181, 0.1);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .welcome-card {
      margin-bottom: 1rem;
    }

    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
    }

    .welcome-text h2 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    .welcome-text p {
      margin: 0;
      color: #666;
    }

    .welcome-actions {
      display: flex;
      gap: 1rem;
      flex-shrink: 0;
    }

    .welcome-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      &.positive {
        border-left: 4px solid #4caf50;
      }
      
      &.negative {
        border-left: 4px solid #f44336;
      }
      
      &.neutral {
        border-left: 4px solid #2196f3;
      }
      
      &.accent {
        border-left: 4px solid #9c27b0;
      }
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }

    .positive .stat-icon { color: #4caf50; }
    .negative .stat-icon { color: #f44336; }
    .neutral .stat-icon { color: #2196f3; }
    .accent .stat-icon { color: #9c27b0; }

    .stat-info h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .stat-info p {
      margin: 0.25rem 0;
      color: #666;
      font-weight: 500;
    }

    .stat-info small {
      color: #999;
      font-size: 0.8rem;
    }

    .status-card {
      margin-bottom: 1rem;
    }

    .status-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      &.completed {
        color: #4caf50;
        
        mat-icon {
          color: #4caf50;
        }
      }
    }

    // User Menu Styles
    .user-menu {
      min-width: 280px;
    }

    .user-info {
      display: flex;
      align-items: center;
      padding: 1rem;
    }

    .user-avatar-large {
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

    .user-details {
      .user-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.25rem;
      }
      
      .user-email {
        color: #666;
        font-size: 0.9rem;
      }
    }

    .logout-btn {
      color: #f44336 !important;
      
      mat-icon {
        color: #f44336;
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0.5rem;
      }
      
      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .welcome-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .welcome-actions {
        width: 100%;
        
        button {
          flex: 1;
        }
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize observable after authService is available
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Fetch fresh user data when dashboard loads
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('Dashboard loaded for user:', user);
        },
        error: (error) => {
          console.error('Failed to load user data:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.authService.logout();
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUserValue();
    if (!user?.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getFirstName(): string {
    const user = this.authService.getCurrentUserValue();
    if (!user?.name) return 'User';
    
    return user.name.split(' ')[0];
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  onCreateExpense(): void {
    this.router.navigate(['/transactions/create']);
  }

  onViewAllTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  onViewAllBalances(): void {
    this.router.navigate(['/balances']);
  }

  onSettleUp(): void {
    this.router.navigate(['/balances/settle']);
  }
}