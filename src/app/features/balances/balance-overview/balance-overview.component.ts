import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { BalanceService } from '../../../core/services/balance.service';
import { UserBalance, Balance } from '../../../shared/models/balance.model';

@Component({
  selector: 'app-balance-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule
  ],
  template: `
    <div class="balance-overview-container">
      <div class="overview-header">
        <div class="header-content">
          <h1>Balance Overview</h1>
          <p>Track who owes what and settle up</p>
        </div>
        <button mat-raised-button color="primary" (click)="onSettleUp()">
          <mat-icon>payment</mat-icon>
          Settle Up
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading balances...</p>
      </div>

      <!-- Balance Summary -->
      <div *ngIf="!loading && userBalance" class="balance-summary">
        <div class="summary-cards">
          <mat-card class="summary-card positive">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">trending_up</mat-icon>
                <div class="summary-info">
                  <h3>${{ userBalance.totalOwed.toFixed(2) }}</h3>
                  <p>You are owed</p>
                  <small>Money coming to you</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card negative">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">trending_down</mat-icon>
                <div class="summary-info">
                  <h3>${{ userBalance.totalOwing.toFixed(2) }}</h3>
                  <p>You owe</p>
                  <small>Money you need to pay</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card" [class.positive]="userBalance.netBalance > 0" 
                    [class.negative]="userBalance.netBalance < 0" 
                    [class.neutral]="userBalance.netBalance === 0">
            <mat-card-content>
              <div class="summary-content">
                <mat-icon class="summary-icon">account_balance</mat-icon>
                <div class="summary-info">
                  <h3>${{ Math.abs(userBalance.netBalance).toFixed(2) }}</h3>
                  <p>Net balance</p>
                  <small>{{ getNetBalanceText() }}</small>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Individual Balances -->
      <mat-card *ngIf="!loading" class="balances-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>people</mat-icon>
            Individual Balances
          </mat-card-title>
          <div class="spacer"></div>
          <button mat-button (click)="onRefresh()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </mat-card-header>

        <mat-card-content>
          <!-- Empty State -->
          <div *ngIf="!userBalance || userBalance.balances.length === 0" class="empty-state">
            <mat-icon class="empty-icon">account_balance</mat-icon>
            <h3>No balances yet</h3>
            <p>Your balances with friends will appear here after you create some expenses.</p>
            <button mat-raised-button color="primary" (click)="onCreateExpense()">
              <mat-icon>add_circle</mat-icon>
              Create First Expense
            </button>
          </div>

          <!-- Balances List -->
          <mat-list *ngIf="userBalance && userBalance.balances.length > 0">
            <mat-list-item *ngFor="let balance of userBalance.balances" class="balance-item">
              <div class="balance-avatar" matListIcon>
                {{ getUserInitials(balance) }}
              </div>

              <div matLine class="balance-main">
                <div class="balance-header">
                  <span class="balance-name">{{ getOtherUserName(balance) }}</span>
                  <span class="balance-amount" [class]="getBalanceAmountClass(balance)">
                    {{ formatBalanceAmount(balance) }}
                  </span>
                </div>
                
                <div class="balance-description">
                  {{ balance.description }}
                </div>
                
                <div class="balance-meta">
                  <mat-chip [class]="balance.isSettled ? 'settled-chip' : 'active-chip'">
                    {{ balance.isSettled ? 'Settled' : 'Active' }}
                  </mat-chip>
                  <span class="balance-date">
                    {{ formatDate(balance.lastUpdated) }}
                  </span>
                </div>
              </div>

              <div class="balance-actions">
                <button mat-icon-button [matMenuTriggerFor]="balanceMenu" 
                        [matMenuTriggerData]="{balance: balance}">
                  <mat-icon>more_vert</mat-icon>
                </button>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>

      <!-- Quick Actions -->
      <mat-card class="actions-card" *ngIf="!loading && userBalance && userBalance.balances.length > 0">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>flash_on</mat-icon>
            Quick Actions
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="onSettleUp()">
              <mat-icon>payment</mat-icon>
              Settle All Debts
            </button>
            <button mat-stroked-button (click)="onCreateExpense()">
              <mat-icon>add_circle</mat-icon>
              Add New Expense
            </button>
            <button mat-stroked-button (click)="onViewHistory()">
              <mat-icon>history</mat-icon>
              Settlement History
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Balance Menu -->
    <mat-menu #balanceMenu="matMenu">
      <ng-template matMenuContent let-balance="balance">
        <button mat-menu-item (click)="onSettleBalance(balance)" [disabled]="balance.isSettled">
          <mat-icon>payment</mat-icon>
          <span>Settle Up</span>
        </button>
        <button mat-menu-item (click)="onViewBalanceDetails(balance)">
          <mat-icon>visibility</mat-icon>
          <span>View Details</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="onRemindUser(balance)" [disabled]="balance.isSettled">
          <mat-icon>notifications</mat-icon>
          <span>Send Reminder</span>
        </button>
      </ng-template>
    </mat-menu>
  `,
  styles: [`
    .balance-overview-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
    }

    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-content {
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

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;

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

    .balance-summary {
      margin-bottom: 2rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .summary-card {
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

      .summary-content {
        display: flex;
        align-items: center;
        gap: 1rem;

        .summary-icon {
          font-size: 2.5rem;
          width: 2.5rem;
          height: 2.5rem;
        }

        .summary-info {
          h3 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
          }

          p {
            margin: 0.25rem 0;
            color: #666;
            font-weight: 500;
          }

          small {
            color: #999;
            font-size: 0.8rem;
          }
        }
      }

      &.positive .summary-icon { color: #4caf50; }
      &.negative .summary-icon { color: #f44336; }
      &.neutral .summary-icon { color: #2196f3; }
    }

    .balances-card, .actions-card {
      margin-bottom: 2rem;

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

    .balance-item {
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .balance-avatar {
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
        flex-shrink: 0;
      }

      .balance-main {
        flex: 1;
        min-width: 0;

        .balance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          .balance-name {
            font-weight: 500;
            color: #333;
            font-size: 1rem;
          }

          .balance-amount {
            font-weight: 600;
            font-size: 1.1rem;

            &.positive {
              color: #4caf50;
            }

            &.negative {
              color: #f44336;
            }

            &.neutral {
              color: #666;
            }
          }
        }

        .balance-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .balance-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .settled-chip {
            background-color: #f3e5f5;
            color: #7b1fa2;
            font-size: 0.75rem;
            height: 24px;
          }

          .active-chip {
            background-color: #e8f5e8;
            color: #2e7d32;
            font-size: 0.75rem;
            height: 24px;
          }

          .balance-date {
            color: #999;
            font-size: 0.85rem;
            margin-left: auto;
          }
        }
      }

      .balance-actions {
        flex-shrink: 0;
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
      .balance-overview-container {
        padding: 0.5rem;
      }

      .overview-header .header-content h1 {
        font-size: 1.5rem;
      }

      .balance-item {
        .balance-main .balance-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .balance-main .balance-meta {
          flex-wrap: wrap;

          .balance-date {
            margin-left: 0;
          }
        }
      }
    }
  `]
})
export class BalanceOverviewComponent implements OnInit, OnDestroy {
  userBalance: UserBalance | null = null;
  loading = true;
  currentUserId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private balanceService: BalanceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    const currentUser = this.authService.getCurrentUserValue();
    this.currentUserId = currentUser?.id || 0;
  }

  ngOnInit(): void {
    this.loadBalances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBalances(): void {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    this.balanceService.getUserBalances(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userBalance) => {
          this.userBalance = userBalance;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load balances:', error);
          this.loading = false;
          this.showMessage('Failed to load balances', 'error-snackbar');
        }
      });
  }

  onRefresh(): void {
    this.loading = true;
    this.loadBalances();
  }

  onSettleUp(): void {
    this.router.navigate(['/balances/settle']);
  }

  onCreateExpense(): void {
    this.router.navigate(['/transactions/create']);
  }

  onViewHistory(): void {
    this.router.navigate(['/balances/settlements']);
  }

  onSettleBalance(balance: Balance): void {
    this.router.navigate(['/balances/settle'], {
      queryParams: { balanceId: balance.balanceId }
    });
  }

  onViewBalanceDetails(balance: Balance): void {
    // Navigate to balance details page (to be implemented)
    console.log('View balance details:', balance);
  }

  onRemindUser(balance: Balance): void {
    // Send reminder functionality (to be implemented)
    this.showMessage('Reminder sent successfully!', 'success-snackbar');
  }

  getUserInitials(balance: Balance): string {
    const otherUserName = this.getOtherUserName(balance);
    if (!otherUserName) return 'U';
    
    const names = otherUserName.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getOtherUserName(balance: Balance): string {
    return balance.user1 === this.currentUserId ? balance.user2Name : balance.user1Name;
  }

  getBalanceAmountClass(balance: Balance): string {
    if (balance.amount > 0) {
      return balance.user1 === this.currentUserId ? 'positive' : 'negative';
    } else if (balance.amount < 0) {
      return balance.user1 === this.currentUserId ? 'negative' : 'positive';
    }
    return 'neutral';
  }

  formatBalanceAmount(balance: Balance): string {
    const amount = Math.abs(balance.amount);
    const isOwed = (balance.amount > 0 && balance.user1 === this.currentUserId) ||
                   (balance.amount < 0 && balance.user2 === this.currentUserId);
    
    return isOwed ? `+$${amount.toFixed(2)}` : `-$${amount.toFixed(2)}`;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getNetBalanceText(): string {
    if (!this.userBalance) return '';
    
    if (this.userBalance.netBalance > 0) {
      return 'You are owed overall';
    } else if (this.userBalance.netBalance < 0) {
      return 'You owe overall';
    }
    return 'You are settled up';
  }

  private showMessage(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}