import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../../core/services/auth.service';
import { BalanceService } from '../../../core/services/balance.service';
import { Settlement, SettlementStatus } from '../../../shared/models/balance.model';

@Component({
  selector: 'app-settlement-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="settlement-history-container">
      <div class="history-header">
        <div class="header-content">
          <h1>Settlement History</h1>
          <p>View all your payment records and settlements</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/balances/settle">
          <mat-icon>add</mat-icon>
          New Settlement
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading settlement history...</p>
      </div>

      <!-- Settlements List -->
      <mat-card *ngIf="!loading" class="settlements-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>history</mat-icon>
            All Settlements ({{ settlements.length }})
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Empty State -->
          <div *ngIf="settlements.length === 0" class="empty-state">
            <mat-icon class="empty-icon">payment</mat-icon>
            <h3>No settlements yet</h3>
            <p>Your payment history will appear here once you start settling up.</p>
            <button mat-raised-button color="primary" routerLink="/balances/settle">
              <mat-icon>add</mat-icon>
              Record First Settlement
            </button>
          </div>

          <!-- Settlements List -->
          <mat-list *ngIf="settlements.length > 0">
            <mat-list-item *ngFor="let settlement of settlements" class="settlement-item">
              <div class="settlement-icon" matListIcon>
                <mat-icon [class]="getSettlementIconClass(settlement)">
                  {{ getSettlementIcon(settlement) }}
                </mat-icon>
              </div>

              <div matLine class="settlement-main">
                <div class="settlement-header">
                  <span class="settlement-description">{{ settlement.description }}</span>
                  <span class="settlement-amount" [class]="getAmountClass(settlement)">
                    {{ formatAmount(settlement) }}
                  </span>
                </div>
                
                <div class="settlement-details">
                  <span class="settlement-participants">
                    {{ getParticipantsText(settlement) }}
                  </span>
                  <mat-chip [class]="'status-chip status-' + settlement.status.toLowerCase()">
                    {{ settlement.status }}
                  </mat-chip>
                </div>
                
                <div class="settlement-meta">
                  <span class="settlement-date">{{ formatDate(settlement.createdAt) }}</span>
                  <span *ngIf="settlement.settledAt" class="settled-date">
                    Settled: {{ formatDate(settlement.settledAt) }}
                  </span>
                </div>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>

      <!-- Summary Stats -->
      <div *ngIf="!loading && settlements.length > 0" class="summary-stats">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">trending_up</mat-icon>
              <div class="stat-info">
                <h3>${{ getTotalReceived().toFixed(2) }}</h3>
                <p>Total Received</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">trending_down</mat-icon>
              <div class="stat-info">
                <h3>${{ getTotalPaid().toFixed(2) }}</h3>
                <p>Total Paid</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon">receipt</mat-icon>
              <div class="stat-info">
                <h3>{{ settlements.length }}</h3>
                <p>Total Settlements</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .settlement-history-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
    }

    .history-header {
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

    .settlements-card {
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

    .settlement-item {
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .settlement-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1rem;
        flex-shrink: 0;

        &.received {
          background-color: rgba(76, 175, 80, 0.1);
          
          mat-icon {
            color: #4caf50;
          }
        }

        &.paid {
          background-color: rgba(244, 67, 54, 0.1);
          
          mat-icon {
            color: #f44336;
          }
        }

        &.pending {
          background-color: rgba(255, 152, 0, 0.1);
          
          mat-icon {
            color: #ff9800;
          }
        }
      }

      .settlement-main {
        flex: 1;
        min-width: 0;

        .settlement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .settlement-description {
            font-weight: 500;
            color: #333;
            font-size: 1rem;
          }

          .settlement-amount {
            font-weight: 600;
            font-size: 1.1rem;

            &.positive {
              color: #4caf50;
            }

            &.negative {
              color: #f44336;
            }
          }
        }

        .settlement-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;

          .settlement-participants {
            color: #666;
            font-size: 0.9rem;
          }

          .status-chip {
            font-size: 0.75rem;
            height: 24px;

            &.status-completed {
              background-color: #e8f5e8;
              color: #2e7d32;
            }

            &.status-pending {
              background-color: #fff3e0;
              color: #f57c00;
            }

            &.status-cancelled {
              background-color: #ffebee;
              color: #c62828;
            }
          }
        }

        .settlement-meta {
          display: flex;
          gap: 1rem;
          color: #999;
          font-size: 0.85rem;

          @media (max-width: 768px) {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
      }
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;

      .stat-card {
        .stat-content {
          display: flex;
          align-items: center;
          gap: 1rem;

          .stat-icon {
            font-size: 2rem;
            width: 2rem;
            height: 2rem;
            color: #3f51b5;
          }

          .stat-info {
            h3 {
              margin: 0;
              font-size: 1.25rem;
              font-weight: 600;
              color: #333;
            }

            p {
              margin: 0.25rem 0 0 0;
              color: #666;
              font-size: 0.9rem;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .settlement-history-container {
        padding: 0.5rem;
      }

      .history-header .header-content h1 {
        font-size: 1.5rem;
      }

      .summary-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SettlementHistoryComponent implements OnInit, OnDestroy {
  settlements: Settlement[] = [];
  loading = true;
  currentUserId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private balanceService: BalanceService
  ) {
    const currentUser = this.authService.getCurrentUserValue();
    this.currentUserId = currentUser?.id || 0;
  }

  ngOnInit(): void {
    this.loadSettlements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSettlements(): void {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    this.balanceService.getUserSettlements(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settlements) => {
          this.settlements = settlements.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load settlements:', error);
          this.loading = false;
        }
      });
  }

  getSettlementIcon(settlement: Settlement): string {
    if (settlement.status === SettlementStatus.PENDING) {
      return 'schedule';
    }
    
    return settlement.fromUserId === this.currentUserId ? 'arrow_upward' : 'arrow_downward';
  }

  getSettlementIconClass(settlement: Settlement): string {
    if (settlement.status === SettlementStatus.PENDING) {
      return 'pending';
    }
    
    return settlement.fromUserId === this.currentUserId ? 'paid' : 'received';
  }

  getAmountClass(settlement: Settlement): string {
    return settlement.fromUserId === this.currentUserId ? 'negative' : 'positive';
  }

  formatAmount(settlement: Settlement): string {
    const prefix = settlement.fromUserId === this.currentUserId ? '-' : '+';
    return `${prefix}$${settlement.amount.toFixed(2)}`;
  }

  getParticipantsText(settlement: Settlement): string {
    if (settlement.fromUserId === this.currentUserId) {
      return `You paid ${settlement.toUserName}`;
    } else {
      return `${settlement.fromUserName} paid you`;
    }
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalReceived(): number {
    return this.settlements
      .filter(s => s.toUserId === this.currentUserId && s.status === SettlementStatus.COMPLETED)
      .reduce((total, s) => total + s.amount, 0);
  }

  getTotalPaid(): number {
    return this.settlements
      .filter(s => s.fromUserId === this.currentUserId && s.status === SettlementStatus.COMPLETED)
      .reduce((total, s) => total + s.amount, 0);
  }
}