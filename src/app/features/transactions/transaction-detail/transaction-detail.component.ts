import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDetail, TransactionStatus } from '../../../shared/models/transaction.model';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="transaction-detail-container">
      <div class="detail-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Transaction Details</h1>
          <p>View and manage transaction information</p>
        </div>
        <div class="header-actions" *ngIf="transaction">
          <button mat-icon-button [matMenuTriggerFor]="actionMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transaction details...</p>
      </div>

      <!-- Transaction Details -->
      <div *ngIf="!loading && transaction" class="transaction-content">
        
        <!-- Main Transaction Info -->
        <mat-card class="transaction-card">
          <mat-card-header>
            <div class="transaction-icon" mat-card-avatar>
              <mat-icon>{{ getCategoryIcon(transaction.category) }}</mat-icon>
            </div>
            <mat-card-title>{{ transaction.description }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip [class]="'status-chip status-' + transaction.status.toLowerCase()">
                {{ transaction.status }}
              </mat-chip>
              <mat-chip class="category-chip">{{ transaction.category }}</mat-chip>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="transaction-summary">
              <div class="summary-item">
                <span class="label">Total Amount:</span>
                <span class="value amount">$ {{ transaction.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Split Type:</span>
                <span class="value">{{ formatSplitType(transaction.splitType) }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Created:</span>
                <span class="value">{{ formatDate(transaction.createdAt) }}</span>
              </div>
              <div class="summary-item" *ngIf="transaction.updatedAt && transaction.updatedAt !== transaction.createdAt">
                <span class="label">Last Updated:</span>
                <span class="value">{{ formatDate(transaction.updatedAt) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Participants -->
        <mat-card class="participants-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>group</mat-icon>
              Participants
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let participant of transaction.participants" class="participant-item">
                <div class="participant-avatar" matListIcon>
                  {{ getParticipantInitials(participant.userId) }}
                </div>

                <div matLine class="participant-info">
                  <div class="participant-header">
                    <span class="participant-name">
                      {{ getParticipantName(participant.userId) }}
                      <span *ngIf="participant.userId === transaction.paidBy" class="payer-badge">(Paid)</span>
                    </span>
                    <span class="participant-amount">
                      ${{ participant.amount?.toFixed(2) || '0.00' }}
                      <span *ngIf="participant.percentage" class="percentage">
                        ({{ participant.percentage }}%)
                      </span>
                    </span>
                  </div>
                  
                  <div class="participant-status">
                    <mat-chip class="participant-chip" 
                             [class.payer]="participant.userId === transaction.paidBy"
                             [class.owes]="participant.userId !== transaction.paidBy">
                      {{ participant.userId === transaction.paidBy ? 'Paid the bill' : 'Owes money' }}
                    </mat-chip>
                  </div>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <!-- Settlements (if any) -->
        <mat-card class="settlements-card" *ngIf="transaction.settlements && transaction.settlements.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>payment</mat-icon>
              Related Settlements
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let settlement of transaction.settlements" class="settlement-item">
                <div class="settlement-icon" matListIcon>
                  <mat-icon [class]="getSettlementIconClass(settlement.status)">
                    {{ getSettlementIcon(settlement.status) }}
                  </mat-icon>
                </div>

                <div matLine class="settlement-info">
                  <div class="settlement-header">
                    <span class="settlement-description">{{ settlement.description }}</span>
                    <span class="settlement-amount">${{ settlement.amount.toFixed(2) }}</span>
                  </div>
                  
                  <div class="settlement-details">
                    <span class="settlement-participants">
                      {{ settlement.fromUserName }} → {{ settlement.toUserName }}
                    </span>
                    <mat-chip [class]="'status-chip status-' + settlement.status.toLowerCase()">
                      {{ settlement.status }}
                    </mat-chip>
                  </div>
                  
                  <div class="settlement-date">
                    {{ formatDate(settlement.createdAt) }}
                    <span *ngIf="settlement.settledAt"> • Settled: {{ formatDate(settlement.settledAt) }}</span>
                  </div>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <!-- Actions -->
        <mat-card class="actions-card" *ngIf="transaction.status === 'ACTIVE'">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>flash_on</mat-icon>
              Quick Actions
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="onSettleTransaction()">
                <mat-icon>payment</mat-icon>
                Settle Up
              </button>
              <button mat-stroked-button (click)="onEditTransaction()">
                <mat-icon>edit</mat-icon>
                Edit Transaction
              </button>
              <button mat-stroked-button color="warn" (click)="onDeleteTransaction()">
                <mat-icon>delete</mat-icon>
                Delete Transaction
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !transaction" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Transaction not found</h3>
        <p>The transaction you're looking for doesn't exist or has been deleted.</p>
        <button mat-raised-button color="primary" (click)="onBack()">
          <mat-icon>arrow_back</mat-icon>
          Go Back
        </button>
      </div>
    </div>

    <!-- Action Menu -->
    <mat-menu #actionMenu="matMenu">
      <button mat-menu-item (click)="onEditTransaction()" [disabled]="transaction?.status !== 'ACTIVE'">
        <mat-icon>edit</mat-icon>
        <span>Edit</span>
      </button>
      <button mat-menu-item (click)="onSettleTransaction()" [disabled]="transaction?.status !== 'ACTIVE'">
        <mat-icon>payment</mat-icon>
        <span>Settle</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="onDeleteTransaction()" [disabled]="transaction?.status !== 'ACTIVE'" class="delete-action">
        <mat-icon>delete</mat-icon>
        <span>Delete</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .transaction-detail-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      .back-button {
        flex-shrink: 0;
      }

      .header-content {
        flex: 1;

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

      .header-actions {
        flex-shrink: 0;
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

    .transaction-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .transaction-card, .participants-card, .settlements-card, .actions-card {
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }

        mat-card-subtitle {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
      }
    }

    .transaction-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: rgba(63, 81, 181, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: #3f51b5;
        font-size: 1.75rem;
      }
    }

    .status-chip {
      font-size: 0.75rem;
      height: 24px;

      &.status-active {
        background-color: #e8f5e8;
        color: #2e7d32;
      }

      &.status-settled {
        background-color: #f3e5f5;
        color: #7b1fa2;
      }

      &.status-cancelled {
        background-color: #ffebee;
        color: #c62828;
      }
    }

    .category-chip {
      background-color: #e3f2fd;
      color: #1976d2;
      font-size: 0.75rem;
      height: 24px;
    }

    .transaction-summary {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #666;
          font-weight: 500;
        }

        .value {
          color: #333;
          font-weight: 600;

          &.amount {
            font-size: 1.1rem;
            color: #3f51b5;
          }
        }
      }
    }

    .participant-item, .settlement-item {
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .participant-avatar, .settlement-icon {
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

      .settlement-icon {
        background-color: rgba(63, 81, 181, 0.1);

        mat-icon {
          color: #3f51b5;
        }

        &.completed {
          background-color: rgba(76, 175, 80, 0.1);
          
          mat-icon {
            color: #4caf50;
          }
        }

        &.pending {
          background-color: rgba(255, 152, 0, 0.1);
          
          mat-icon {
            color: #ff9800;
          }
        }
      }

      .participant-info, .settlement-info {
        flex: 1;
        min-width: 0;

        .participant-header, .settlement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          .participant-name, .settlement-description {
            font-weight: 500;
            color: #333;

            .payer-badge {
              color: #4caf50;
              font-weight: 600;
              font-size: 0.9rem;
            }
          }

          .participant-amount, .settlement-amount {
            font-weight: 600;
            color: #3f51b5;

            .percentage {
              color: #666;
              font-weight: 400;
              font-size: 0.9rem;
            }
          }
        }

        .participant-status, .settlement-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;

          .participant-chip {
            font-size: 0.75rem;
            height: 24px;

            &.payer {
              background-color: #e8f5e8;
              color: #2e7d32;
            }

            &.owes {
              background-color: #fff3e0;
              color: #f57c00;
            }
          }

          .settlement-participants {
            color: #666;
            font-size: 0.9rem;
          }
        }

        .settlement-date {
          color: #999;
          font-size: 0.85rem;
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

    .error-state {
      text-align: center;
      padding: 3rem 1rem;

      .error-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #f44336;
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

    .delete-action {
      color: #f44336 !important;

      mat-icon {
        color: #f44336;
      }
    }

    @media (max-width: 768px) {
      .transaction-detail-container {
        padding: 0.5rem;
      }

      .detail-header .header-content h1 {
        font-size: 1.5rem;
      }

      .participant-item, .settlement-item {
        .participant-info, .settlement-info {
          .participant-header, .settlement-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      }
    }
  `]
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  transaction: TransactionDetail | null = null;
  loading = true;
  transactionId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.transactionId = +params['id'];
        this.loadTransaction();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransaction(): void {
    this.transactionService.getTransactionDetails(this.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.transaction = transaction;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load transaction:', error);
          this.loading = false;
          this.showMessage('Failed to load transaction details', 'error-snackbar');
        }
      });
  }

  onBack(): void {
    this.router.navigate(['/transactions']);
  }

  onEditTransaction(): void {
    if (this.transaction) {
      this.router.navigate(['/transactions', this.transaction.id, 'edit']);
    }
  }

  onSettleTransaction(): void {
    if (this.transaction) {
      this.router.navigate(['/balances/settle'], {
        queryParams: { transactionId: this.transaction.id }
      });
    }
  }

  onDeleteTransaction(): void {
    if (!this.transaction) return;

    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      this.transactionService.deleteTransaction(this.transaction.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showMessage('Transaction deleted successfully', 'success-snackbar');
            this.router.navigate(['/transactions']);
          },
          error: (error) => {
            console.error('Failed to delete transaction:', error);
            this.showMessage('Failed to delete transaction', 'error-snackbar');
          }
        });
    }
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

  formatSplitType(splitType: string): string {
    const types: { [key: string]: string } = {
      'EQUAL': 'Split Equally',
      'EXACT': 'Exact Amounts',
      'PERCENTAGE': 'By Percentage'
    };
    return types[splitType] || splitType;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getParticipantName(userId: number): string {
    // In a real app, you'd have a mapping of user IDs to names
    // For now, we'll use the transaction's participant data
    if (this.transaction?.paidBy === userId) {
      return this.transaction.paidByName;
    }
    if (this.transaction?.owedBy === userId) {
      return this.transaction.owedByName;
    }
    return `User ${userId}`;
  }

  getParticipantInitials(userId: number): string {
    const name = this.getParticipantName(userId);
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0] || 'U';
  }

  getSettlementIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'COMPLETED': 'check_circle',
      'PENDING': 'schedule',
      'CANCELLED': 'cancel'
    };
    return icons[status] || 'payment';
  }

  getSettlementIconClass(status: string): string {
    const classes: { [key: string]: string } = {
      'COMPLETED': 'completed',
      'PENDING': 'pending',
      'CANCELLED': 'cancelled'
    };
    return classes[status] || '';
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