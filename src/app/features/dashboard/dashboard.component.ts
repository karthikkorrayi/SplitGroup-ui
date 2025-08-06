import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';
import { BalanceService, BalanceSummary } from '../../core/services/balance.service';
import { ExpenseService, ExpenseListResponse } from '../../core/services/expense.service';
import { User } from '../../shared/models/auth.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1>{{ getGreeting() }}, {{ getFirstName() }}! 👋</h1>
          <p>Here's your expense overview</p>
        </div>
        <button mat-raised-button color="primary" (click)="onAddExpense()" class="add-expense-btn">
          <mat-icon>add</mat-icon>
          Add Expense
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading your dashboard...</p>
      </div>

      <!-- Dashboard Content -->
      <div *ngIf="!loading" class="dashboard-content">
        
        <!-- Balance Summary Cards -->
        <div class="balance-cards">
          <mat-card class="balance-card owed">
            <mat-card-content>
              <div class="card-content">
                <div class="card-icon">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="card-info">
                  <h3>₹{{ balanceSummary?.totalOwed?.toFixed(2) || '0.00' }}</h3>
                  <p>You are owed</p>
                  <small>Money coming to you</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="balance-card owing">
            <mat-card-content>
              <div class="card-content">
                <div class="card-icon">
                  <mat-icon>trending_down</mat-icon>
                </div>
                <div class="card-info">
                  <h3>₹{{ balanceSummary?.totalOwing?.toFixed(2) || '0.00' }}</h3>
                  <p>You owe</p>
                  <small>Money you need to pay</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="balance-card net" [ngClass]="getNetBalanceClass()">
            <mat-card-content>
              <div class="card-content">
                <div class="card-icon">
                  <mat-icon>account_balance</mat-icon>
                </div>
                <div class="card-info">
                  <h3>₹{{ getNetBalanceAmount() }}</h3>
                  <p>Net Balance</p>
                  <small>{{ getNetBalanceText() }}</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Activity -->
        <mat-card class="activity-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>receipt_long</mat-icon>
              Recent Expenses
            </mat-card-title>
            <div class="spacer"></div>
            <button mat-button color="primary" (click)="onViewAllExpenses()">
              View All
            </button>
          </mat-card-header>

          <mat-card-content>
            <!-- Empty State -->
            <div *ngIf="recentExpenses.length === 0" class="empty-state">
              <mat-icon class="empty-icon">receipt_long</mat-icon>
              <h3>No expenses yet</h3>
              <p>Start by adding your first expense!</p>
              <button mat-raised-button color="primary" (click)="onAddExpense()">
                <mat-icon>add</mat-icon>
                Add First Expense
              </button>
            </div>

            <!-- Recent Expenses List -->
            <div *ngIf="recentExpenses.length > 0" class="expenses-list">
              <div *ngFor="let expense of recentExpenses" class="expense-item">
                <div class="expense-icon">
                  <mat-icon>{{ getCategoryIcon(expense.category) }}</mat-icon>
                </div>
                <div class="expense-details">
                  <div class="expense-header">
                    <span class="expense-description">{{ expense.description }}</span>
                    <span class="expense-amount">₹{{ expense.amount.toFixed(2) }}</span>
                  </div>
                  <div class="expense-meta">
                    <span class="expense-category">{{ expense.category }}</span>
                    <span class="expense-date">{{ formatDate(expense.createdAt) }}</span>
                  </div>
                  <div class="expense-participants">
                    <small>Paid by {{ expense.paidByName }} • {{ expense.participants.length + 1 }} people</small>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Quick Actions -->
        <mat-card class="actions-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>flash_on</mat-icon>
              Quick Actions
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="actions-grid">
              <button mat-stroked-button class="action-btn" (click)="onAddExpense()">
                <mat-icon>add_circle</mat-icon>
                <div class="action-content">
                  <span class="action-title">Add Expense</span>
                  <span class="action-subtitle">Split a new bill</span>
                </div>
              </button>

              <button mat-stroked-button class="action-btn" (click)="onViewExpenses()">
                <mat-icon>receipt_long</mat-icon>
                <div class="action-content">
                  <span class="action-title">View Expenses</span>
                  <span class="action-subtitle">See all transactions</span>
                </div>
              </button>

              <button mat-stroked-button class="action-btn" (click)="onViewGroups()">
                <mat-icon>group</mat-icon>
                <div class="action-content">
                  <span class="action-title">View Groups</span>
                  <span class="action-subtitle">Manage expense groups</span>
                </div>
              </button>

              <button mat-stroked-button class="action-btn" (click)="onSettleExpenses()">
                <mat-icon>payment</mat-icon>
                <div class="action-content">
                  <span class="action-title">Settle Up</span>
                  <span class="action-subtitle">Pay back debts</span>
                </div>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .welcome-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .welcome-content {
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

      .add-expense-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;

        @media (max-width: 768px) {
          width: 100%;
          justify-content: center;
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 1rem;

      p {
        color: #666;
        font-size: 1rem;
      }
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .balance-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .balance-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      &.owed {
        border-left: 4px solid #4caf50;
      }

      &.owing {
        border-left: 4px solid #f44336;
      }

      &.net {
        &.positive {
          border-left: 4px solid #4caf50;
        }
        &.negative {
          border-left: 4px solid #f44336;
        }
        &.neutral {
          border-left: 4px solid #2196f3;
        }
      }

      .card-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .card-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          mat-icon {
            font-size: 2rem;
            width: 2rem;
            height: 2rem;
          }
        }

        .card-info {
          flex: 1;

          h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
            margin: 0 0 0.25rem 0;
          }

          p {
            color: #666;
            font-weight: 500;
            margin: 0 0 0.25rem 0;
          }

          small {
            color: #999;
            font-size: 0.85rem;
          }
        }
      }

      &.owed .card-icon {
        background-color: rgba(76, 175, 80, 0.1);
        mat-icon { color: #4caf50; }
      }

      &.owing .card-icon {
        background-color: rgba(244, 67, 54, 0.1);
        mat-icon { color: #f44336; }
      }

      &.net .card-icon {
        background-color: rgba(33, 150, 243, 0.1);
        mat-icon { color: #2196f3; }
      }

      &.net.positive .card-icon {
        background-color: rgba(76, 175, 80, 0.1);
        mat-icon { color: #4caf50; }
      }

      &.net.negative .card-icon {
        background-color: rgba(244, 67, 54, 0.1);
        mat-icon { color: #f44336; }
      }
    }

    .activity-card, .actions-card {
      mat-card-header {
        display: flex;
        align-items: center;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;

      .empty-icon {
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
        margin: 0 0 2rem 0;
      }

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 auto;
      }
    }

    .expenses-list {
      .expense-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .expense-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: rgba(63, 81, 181, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          mat-icon {
            color: #3f51b5;
            font-size: 1.5rem;
          }
        }

        .expense-details {
          flex: 1;
          min-width: 0;

          .expense-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;

            .expense-description {
              font-weight: 500;
              color: #333;
              font-size: 1rem;
            }

            .expense-amount {
              font-weight: 600;
              color: #3f51b5;
              font-size: 1.1rem;
            }
          }

          .expense-meta {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.25rem;

            .expense-category {
              color: #666;
              font-size: 0.9rem;
              font-weight: 500;
            }

            .expense-date {
              color: #999;
              font-size: 0.9rem;
            }
          }

          .expense-participants {
            small {
              color: #666;
              font-size: 0.85rem;
            }
          }
        }
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem;
      height: auto;
      gap: 1rem;
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(63, 81, 181, 0.04);
        border-color: #3f51b5;
        transform: translateY(-1px);
      }

      mat-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
        color: #3f51b5;
      }

      .action-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;

        .action-title {
          font-weight: 600;
          color: #333;
        }

        .action-subtitle {
          font-size: 0.85rem;
          color: #666;
          text-align: center;
        }
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0.5rem;
      }

      .welcome-section .welcome-content h1 {
        font-size: 1.5rem;
      }

      .expenses-list .expense-item {
        .expense-details .expense-header {
          flex-direction: column;
          gap: 0.25rem;
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  balanceSummary: BalanceSummary | null = null;
  recentExpenses: any[] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private balanceService: BalanceService,
    private expenseService: ExpenseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    forkJoin({
      balances: this.balanceService.getBalanceSummary(),
      expenses: this.expenseService.getUserExpenses(0, 5)
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.balanceSummary = data.balances;
        this.recentExpenses = data.expenses.expenses || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.loading = false;
        // Set default values on error
        this.balanceSummary = {
          totalOwed: 0,
          totalOwing: 0,
          netBalance: 0,
          balances: []
        };
        this.recentExpenses = [];
      }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getFirstName(): string {
    return this.currentUser?.name?.split(' ')[0] || 'User';
  }

  getNetBalanceAmount(): string {
    const netBalance = this.balanceSummary?.netBalance || 0;
    return Math.abs(netBalance).toFixed(2);
  }

  getNetBalanceClass(): string {
    const netBalance = this.balanceSummary?.netBalance || 0;
    if (netBalance > 0) return 'positive';
    if (netBalance < 0) return 'negative';
    return 'neutral';
  }

  getNetBalanceText(): string {
    const netBalance = this.balanceSummary?.netBalance || 0;
    if (netBalance > 0) return 'You are owed overall';
    if (netBalance < 0) return 'You owe overall';
    return 'You are settled up';
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Food': 'restaurant',
      'Transportation': 'directions_car',
      'Entertainment': 'movie',
      'Shopping': 'shopping_bag',
      'Utilities': 'flash_on',
      'Travel': 'flight',
      'Healthcare': 'local_hospital',
      'Other': 'receipt'
    };
    return icons[category] || 'receipt';
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // Navigation methods
  onAddExpense(): void {
    this.router.navigate(['/expenses/add']);
  }

  onViewAllExpenses(): void {
    this.router.navigate(['/expenses']);
  }

  onViewExpenses(): void {
    this.router.navigate(['/expenses']);
  }

  onViewGroups(): void {
    this.router.navigate(['/groups']);
  }

  onSettleExpenses(): void {
    this.router.navigate(['/settle']);
  }
}