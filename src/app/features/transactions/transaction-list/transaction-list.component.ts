import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { Transaction, TransactionStatus } from '../../../shared/models/transaction.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="transaction-list-container">
      <div class="list-header">
        <div class="header-content">
          <h1>Transaction History</h1>
          <p>View and manage all your expenses</p>
        </div>
        <button mat-raised-button color="primary" (click)="onCreateTransaction()">
          <mat-icon>add</mat-icon>
          Add Expense
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <mat-form-field appearance="outline">
              <mat-label>Search</mat-label>
              <input matInput formControlName="search" placeholder="Search transactions...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option value="">All Categories</mat-option>
                <mat-option value="Food">🍽️ Food & Dining</mat-option>
                <mat-option value="Transportation">🚗 Transportation</mat-option>
                <mat-option value="Entertainment">🎬 Entertainment</mat-option>
                <mat-option value="Shopping">🛍️ Shopping</mat-option>
                <mat-option value="Utilities">⚡ Utilities</mat-option>
                <mat-option value="Travel">✈️ Travel</mat-option>
                <mat-option value="Healthcare">🏥 Healthcare</mat-option>
                <mat-option value="Other">📝 Other</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">All Status</mat-option>
                <mat-option value="ACTIVE">Active</mat-option>
                <mat-option value="SETTLED">Settled</mat-option>
                <mat-option value="CANCELLED">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-button type="button" (click)="onClearFilters()">
              <mat-icon>clear</mat-icon>
              Clear
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transactions...</p>
      </div>

      <!-- Transactions List -->
      <mat-card *ngIf="!loading" class="transactions-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>receipt_long</mat-icon>
            Transactions ({{ filteredTransactions.length }})
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Empty State -->
          <div *ngIf="filteredTransactions.length === 0" class="empty-state">
            <mat-icon class="empty-icon">receipt_long</mat-icon>
            <h3>No transactions found</h3>
            <p *ngIf="hasActiveFilters()">Try adjusting your filters to see more results.</p>
            <p *ngIf="!hasActiveFilters()">Start by creating your first expense!</p>
            <button mat-raised-button color="primary" (click)="onCreateTransaction()">
              <mat-icon>add</mat-icon>
              Add First Expense
            </button>
          </div>

          <!-- Transactions Table -->
          <div *ngIf="filteredTransactions.length > 0" class="transactions-table">
            <div class="transaction-item" *ngFor="let transaction of filteredTransactions">
              <div class="transaction-main">
                <div class="transaction-icon">
                  <mat-icon>{{ getCategoryIcon(transaction.category) }}</mat-icon>
                </div>
                
                <div class="transaction-details">
                  <div class="transaction-header">
                    <span class="transaction-description">{{ transaction.description }}</span>
                    <span class="transaction-amount" [class]="getAmountClass(transaction, currentUserId)">
                      {{ formatAmount(transaction, currentUserId) }}
                    </span>
                  </div>
                  
                  <div class="transaction-meta">
                    <mat-chip class="category-chip">{{ transaction.category }}</mat-chip>
                    <mat-chip [class]="'status-chip status-' + transaction.status.toLowerCase()">
                      {{ transaction.status }}
                    </mat-chip>
                    <span class="transaction-date">{{ formatDate(transaction.createdAt) }}</span>
                  </div>
                  
                  <div class="transaction-participants">
                    <span class="participants-text">
                      {{ getParticipantsText(transaction) }}
                    </span>
                  </div>
                </div>

                <div class="transaction-actions">
                  <button mat-icon-button [matMenuTriggerFor]="transactionMenu" 
                          [matMenuTriggerData]="{transaction: transaction}">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Transaction Menu -->
    <mat-menu #transactionMenu="matMenu">
      <ng-template matMenuContent let-transaction="transaction">
        <button mat-menu-item (click)="onViewTransaction(transaction)">
          <mat-icon>visibility</mat-icon>
          <span>View Details</span>
        </button>
        <button mat-menu-item (click)="onEditTransaction(transaction)" 
                [disabled]="transaction.status !== 'ACTIVE'">
          <mat-icon>edit</mat-icon>
          <span>Edit</span>
        </button>
        <button mat-menu-item (click)="onSettleTransaction(transaction)" 
                [disabled]="transaction.status !== 'ACTIVE'">
          <mat-icon>payment</mat-icon>
          <span>Settle</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="onDeleteTransaction(transaction)" 
                [disabled]="transaction.status !== 'ACTIVE'" class="delete-action">
          <mat-icon>delete</mat-icon>
          <span>Delete</span>
        </button>
      </ng-template>
    </mat-menu>
  `,
  styles: [`
    .transaction-list-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
    }

    .list-header {
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

    .filters-card {
      margin-bottom: 2rem;
    }

    .filters-form {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;

        mat-form-field {
          width: 100%;
        }
      }

      mat-form-field {
        min-width: 200px;
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

    .transactions-table {
      .transaction-item {
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        margin-bottom: 1rem;
        transition: all 0.2s ease;

        &:hover {
          border-color: #e0e0e0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        &:last-child {
          margin-bottom: 0;
        }
      }

      .transaction-main {
        display: flex;
        align-items: flex-start;
        padding: 1rem;
        gap: 1rem;

        @media (max-width: 768px) {
          flex-direction: column;
          gap: 0.5rem;
        }
      }

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

          @media (max-width: 768px) {
            flex-direction: column;
            gap: 0.25rem;
          }

          .transaction-description {
            font-weight: 500;
            color: #333;
            font-size: 1rem;
          }

          .transaction-amount {
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

        .transaction-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;

          .category-chip {
            background-color: #e3f2fd;
            color: #1976d2;
            font-size: 0.75rem;
            height: 24px;
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

          .transaction-date {
            color: #999;
            font-size: 0.85rem;
            margin-left: auto;

            @media (max-width: 768px) {
              margin-left: 0;
            }
          }
        }

        .transaction-participants {
          .participants-text {
            color: #666;
            font-size: 0.9rem;
          }
        }
      }

      .transaction-actions {
        flex-shrink: 0;

        @media (max-width: 768px) {
          align-self: flex-end;
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
      .transaction-list-container {
        padding: 0.5rem;
      }

      .list-header .header-content h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class TransactionListComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  loading = true;
  currentUserId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.formBuilder.group({
      search: [''],
      category: [''],
      status: ['']
    });

    const currentUser = this.authService.getCurrentUserValue();
    this.currentUserId = currentUser?.id || 0;
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransactions(): void {
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.loading = false;
      return;
    }

    this.transactionService.getUserTransactions(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load transactions:', error);
          this.loading = false;
          this.showMessage('Failed to load transactions', 'error-snackbar');
        }
      });
  }

  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredTransactions = this.transactions.filter(transaction => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesDescription = transaction.description.toLowerCase().includes(searchTerm);
        const matchesPaidBy = transaction.paidByName.toLowerCase().includes(searchTerm);
        const matchesOwedBy = transaction.owedByName.toLowerCase().includes(searchTerm);
        
        if (!matchesDescription && !matchesPaidBy && !matchesOwedBy) {
          return false;
        }
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  hasActiveFilters(): boolean {
    const filters = this.filterForm.value;
    return !!(filters.search || filters.category || filters.status);
  }

  onClearFilters(): void {
    this.filterForm.reset();
  }

  onCreateTransaction(): void {
    this.router.navigate(['/transactions/create']);
  }

  onViewTransaction(transaction: Transaction): void {
    this.router.navigate(['/transactions', transaction.id]);
  }

  onEditTransaction(transaction: Transaction): void {
    this.router.navigate(['/transactions', transaction.id, 'edit']);
  }

  onSettleTransaction(transaction: Transaction): void {
    // Navigate to settlement page or open settlement dialog
    this.router.navigate(['/balances/settle'], { 
      queryParams: { transactionId: transaction.id } 
    });
  }

  onDeleteTransaction(transaction: Transaction): void {
    if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      this.transactionService.deleteTransaction(transaction.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showMessage('Transaction deleted successfully', 'success-snackbar');
            this.loadTransactions();
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

  getAmountClass(transaction: Transaction, currentUserId: number): string {
    if (transaction.paidBy === currentUserId) {
      return 'positive'; // User paid, so they're owed money
    } else if (transaction.owedBy === currentUserId) {
      return 'negative'; // User owes money
    }
    return 'neutral';
  }

  formatAmount(transaction: Transaction, currentUserId: number): string {
    const amount = transaction.amount;
    if (transaction.paidBy === currentUserId) {
      return `+$${amount.toFixed(2)}`;
    } else if (transaction.owedBy === currentUserId) {
      return `-$${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
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

  getParticipantsText(transaction: Transaction): string {
    return `${transaction.paidByName} paid for ${transaction.owedByName}`;
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