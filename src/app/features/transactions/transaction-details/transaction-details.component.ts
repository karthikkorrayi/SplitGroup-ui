import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { TransactionService, Transaction } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="transaction-details-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Transaction Details</h1>
          <p>View transaction information and participants</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transaction details...</p>
      </div>

      <!-- Transaction Details -->
      <div *ngIf="!loading && transaction" class="transaction-content">
        <mat-card class="transaction-card">
          <mat-card-header>
            <div class="transaction-icon">
              <mat-icon>{{ getCategoryIcon(transaction.category) }}</mat-icon>
            </div>
            <mat-card-title>{{ transaction.description }}</mat-card-title>
            <mat-card-subtitle>{{ formatDate(transaction.createdAt) }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="transaction-info">
              <div class="info-item">
                <span class="label">Total Amount:</span>
                <span class="value amount">₹{{ transaction.amount.toFixed(2) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Category:</span>
                <mat-chip class="category-chip">{{ transaction.category }}</mat-chip>
              </div>
              <div class="info-item">
                <span class="label">Status:</span>
                <mat-chip class="status-chip" [class]="'status-' + transaction.status.toLowerCase()">
                  {{ transaction.status }}
                </mat-chip>
              </div>
              <div class="info-item">
                <span class="label">Paid By:</span>
                <span class="value">{{ transaction.paidByName }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="participants-section">
              <h3>Participants</h3>
              <div class="participants-list">
                <div class="participant-item payer">
                  <div class="participant-info">
                    <div class="participant-avatar">
                      {{ getInitials(transaction.paidByName) }}
                    </div>
                    <div class="participant-details">
                      <span class="participant-name">{{ transaction.paidByName }}</span>
                      <small>Paid the bill</small>
                    </div>
                  </div>
                  <div class="participant-amount paid">
                    Paid ₹{{ transaction.amount.toFixed(2) }}
                  </div>
                </div>

                <div *ngFor="let participant of transaction.participants" class="participant-item">
                  <div class="participant-info">
                    <div class="participant-avatar">
                      {{ getInitials(participant.userName) }}
                    </div>
                    <div class="participant-details">
                      <span class="participant-name">{{ participant.userName }}</span>
                      <small>{{ participant.userEmail }}</small>
                    </div>
                  </div>
                  <div class="participant-amount" [class.settled]="participant.settled">
                    Owes ₹{{ participant.amount.toFixed(2) }}
                    <mat-icon *ngIf="participant.settled" class="settled-icon">check_circle</mat-icon>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button (click)="onEdit()">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-button color="warn" (click)="onDelete()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && !transaction" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Transaction not found</h3>
        <p>The transaction you're looking for doesn't exist or has been deleted.</p>
        <button mat-raised-button color="primary" (click)="onBack()">
          Go Back
        </button>
      </div>
    </div>
  `,
  styles: [`
    .transaction-details-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      .back-button {
        flex-shrink: 0;
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
    }

    .loading-container, .error-state {
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

      .error-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: #f44336;
      }

      h3 {
        color: #333;
        margin: 0;
      }
    }

    .transaction-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 1rem;

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
            font-size: 2rem;
          }
        }
      }
    }

    .transaction-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .label {
          font-weight: 500;
          color: #666;
        }

        .value {
          font-weight: 600;
          color: #333;

          &.amount {
            color: #3f51b5;
            font-size: 1.1rem;
          }
        }

        .category-chip {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .status-chip {
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
    }

    .participants-section {
      h3 {
        margin: 1rem 0;
        color: #333;
        font-weight: 600;
      }

      .participants-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .participant-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #f0f0f0;
          border-radius: 8px;

          &.payer {
            background-color: rgba(76, 175, 80, 0.08);
            border-color: rgba(76, 175, 80, 0.3);
          }

          .participant-info {
            display: flex;
            align-items: center;
            gap: 1rem;

            .participant-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 0.9rem;
            }

            .participant-details {
              .participant-name {
                font-weight: 500;
                color: #333;
                display: block;
              }

              small {
                color: #666;
                font-size: 0.85rem;
              }
            }
          }

          .participant-amount {
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;

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

    @media (max-width: 768px) {
      .transaction-details-container {
        padding: 0.5rem;
      }

      .page-header .header-content h1 {
        font-size: 1.5rem;
      }

      .participant-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        .participant-amount {
          align-self: flex-end;
        }
      }
    }
  `]
})
export class TransactionDetailsComponent implements OnInit, OnDestroy {
  transaction: Transaction | null = null;
  loading = true;
  transactionId!: number;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.transactionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTransaction();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransaction(): void {
    this.transactionService.getTransactionById(this.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.transaction = transaction;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load transaction:', error);
          this.loading = false;
        }
      });
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  onBack(): void {
    this.router.navigate(['/transactions']);
  }

  onEdit(): void {
    this.router.navigate(['/transactions', this.transactionId, 'edit']);
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteTransaction(this.transactionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/transactions']);
          },
          error: (error) => {
            console.error('Failed to delete transaction:', error);
            alert('Failed to delete transaction. Please try again.');
          }
        });
    }
  }
}