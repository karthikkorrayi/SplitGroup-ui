import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { TransactionService, Transaction, TransactionListResponse } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="transaction-history-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Transaction History</h1>
          <p>View and manage all your expense transactions</p>
        </div>
        <button mat-raised-button color="primary" (click)="onAddTransaction()">
          <mat-icon>add</mat-icon>
          Add Transaction
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transactions...</p>
      </div>

      <!-- Transaction List -->
      <mat-card *ngIf="!loading" class="transactions-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>receipt_long</mat-icon>
            All Transactions
          </mat-card-title>
          <div class="spacer"></div>
          <div class="header-actions">
            <button mat-icon-button [matMenuTriggerFor]="filterMenu">
              <mat-icon>filter_list</mat-icon>
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          <!-- Empty State -->
          <div *ngIf="transactions.length === 0 && !loading" class="empty-state">
            <mat-icon class="empty-icon">receipt_long</mat-icon>
            <h3>No transactions yet</h3>
            <p>Start by creating your first transaction!</p>
            <button mat-raised-button color="primary" (click)="onAddTransaction()">
              <mat-icon>add</mat-icon>
              Create First Transaction
            </button>
          </div>

          <!-- Transactions List -->
          <div *ngIf="transactions.length > 0" class="transactions-list">
            <div *ngFor="let transaction of transactions" class="transaction-item">
              <div class="transaction-main">
                <div class="transaction-info">
                  <div class="transaction-icon">
                    <mat-icon>{{ getCategoryIcon(transaction.category) }}</mat-icon>
                  </div>
                  <div class="transaction-details">
                    <div class="transaction-header">
                      <span class="transaction-description">{{ transaction.description }}</span>
                      <span class="transaction-amount">₹{{ transaction.amount.toFixed(2) }}</span>
                    </div>
                    <div class="transaction-meta">
                      <mat-chip class="category-chip">{{ transaction.category }}</mat-chip>
                      <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                      <mat-chip class="status-chip" [class]="'status-' + transaction.status.toLowerCase()">
                        {{ transaction.status }}
                      </mat-chip>
                    </div>
                    <div class="transaction-participants">
                      <span class="paid-by">Paid by {{ transaction.paidByName }}</span>
                      <span class="participant-count">• {{ transaction.participants.length + 1 }} people</span>
                    </div>
                  </div>
                </div>
                <div class="transaction-actions">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu" [matMenuTriggerData]="{transaction: transaction}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Participants Details -->
              <div class="participants-section" *ngIf="transaction.participants.length > 0">
                <h4>Split Details:</h4>
                <div class="participants-list">
                  <div class="participant-item">
                    <span class="participant-name">{{ transaction.paidByName }} (You)</span>
                    <span class="participant-amount paid">Paid ₹{{ transaction.amount.toFixed(2) }}</span>
                  </div>
                  <div *ngFor="let participant of transaction.participants" class="participant-item">
                    <span class="participant-name">{{ participant.userName }}</span>
                    <span class="participant-amount" [class.settled]="participant.settled">
                      Owes ₹{{ participant.amount.toFixed(2) }}
                      <mat-icon *ngIf="participant.settled" class="settled-icon">check_circle</mat-icon>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <mat-paginator 
            *ngIf="totalTransactions > 0"
            [length]="totalTransactions"
            [pageSize]="pageSize"
            [pageIndex]="currentPage"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Filter Menu -->
    <mat-menu #filterMenu="matMenu">
      <button mat-menu-item>
        <mat-icon>today</mat-icon>
        <span>This Week</span>
      </button>
      <button mat-menu-item>
        <mat-icon>date_range</mat-icon>
        <span>This Month</span>
      </button>
      <button mat-menu-item>
        <mat-icon>category</mat-icon>
        <span>By Category</span>
      </button>
    </mat-menu>

    <!-- Action Menu -->
    <mat-menu #actionMenu="matMenu">
      <ng-template matMenuContent let-transaction="transaction">
        <button mat-menu-item (click)="onViewTransaction(transaction)">
          <mat-icon>visibility</mat-icon>
          <span>View Details</span>
        </button>
        <button mat-menu-item (click)="onEditTransaction(transaction)">
          <mat-icon>edit</mat-icon>
          <span>Edit</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="onDeleteTransaction(transaction)" class="delete-action">
          <mat-icon>delete</mat-icon>
          <span>Delete</span>
        </button>
      </ng-template>
    </mat-menu>
  `,
  styles: [`
    .transaction-history-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }

    .page-header {
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

    .transactions-card {
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

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

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

    .transactions-list {
      .transaction-item {
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        margin-bottom: 1rem;
        overflow: hidden;

        &:last-child {
          margin-bottom: 0;
        }

        .transaction-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem;

          .transaction-info {
            display: flex;
            gap: 1rem;
            flex: 1;

            .transaction-icon {
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

            .transaction-details {
              flex: 1;
              min-width: 0;

              .transaction-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.5rem;

                .transaction-description {
                  font-weight: 500;
                  color: #333;
                  font-size: 1rem;
                }

                .transaction-amount {
                  font-weight: 600;
                  color: #3f51b5;
                  font-size: 1.1rem;
                }
              }

              .transaction-meta {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 0.5rem;
                flex-wrap: wrap;

                .category-chip {
                  font-size: 0.75rem;
                  height: 24px;
                  background-color: #e3f2fd;
                  color: #1976d2;
                }

                .transaction-date {
                  color: #999;
                  font-size: 0.9rem;
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
              }

              .transaction-participants {
                color: #666;
                font-size: 0.9rem;

                .paid-by {
                  font-weight: 500;
                }

                .participant-count {
                  margin-left: 0.5rem;
                }
              }
            }
          }

          .transaction-actions {
            flex-shrink: 0;
          }
        }

        .participants-section {
          background-color: #f8f9fa;
          padding: 1rem;
          border-top: 1px solid #f0f0f0;

          h4 {
            margin: 0 0 0.75rem 0;
            font-size: 0.9rem;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .participants-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .participant-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 0.5rem 0;

              .participant-name {
                color: #333;
                font-weight: 500;
              }

              .participant-amount {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-weight: 600;

                &.paid {
                  color: #4caf50;
                }

                &.settled {
                  color: #9c27b0;
                }

                .settled-icon {
                  font-size: 1rem;
                  width: 1rem;
                  height: 1rem;
                  color: #4caf50;
                }
              }
            }
          }
        }
      }
    }

    .delete-action {
      color: #f44336 !important;

      mat-icon {
        color: #f44336;
      }
    }

    @media (max-width: 768px) {
      .transaction-history-container {
        padding: 0.5rem;
      }

      .page-header .header-content h1 {
        font-size: 1.5rem;
      }

      .transaction-item .transaction-main {
        flex-direction: column;
        gap: 1rem;

        .transaction-actions {
          align-self: flex-end;
        }
      }

      .transaction-details .transaction-header {
        flex-direction: column;
        gap: 0.25rem;
      }

      .transaction-meta {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 0.5rem !important;
      }
    }
  `]
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  loading = true;
  currentUser: User | null = null;
  
  // Pagination
  totalTransactions = 0;
  currentPage = 0;
  pageSize = 20;

  private destroy$ = new Subject<void>();

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransactions(): void {
    this.loading = true;
    
    this.transactionService.getUserTransactions(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TransactionListResponse) => {
          this.transactions = response.transactions || [];
          this.totalTransactions = response.total || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load transactions:', error);
          this.loading = false;
          this.transactions = [];
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransactions();
  }

  onAddTransaction(): void {
    this.router.navigate(['/expenses/add']);
  }

  onViewTransaction(transaction: Transaction): void {
    // Navigate to transaction details page
    this.router.navigate(['/transactions', transaction.id]);
  }

  onEditTransaction(transaction: Transaction): void {
    // Navigate to edit transaction page
    this.router.navigate(['/transactions', transaction.id, 'edit']);
  }

  onDeleteTransaction(transaction: Transaction): void {
    if (confirm(`Are you sure you want to delete "${transaction.description}"?`)) {
      this.transactionService.deleteTransaction(transaction.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadTransactions(); // Reload the list
          },
          error: (error) => {
            console.error('Failed to delete transaction:', error);
            alert('Failed to delete transaction. Please try again.');
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

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}