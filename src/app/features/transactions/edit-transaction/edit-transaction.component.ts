import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TransactionService, Transaction, CreateTransactionRequest } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-edit-transaction',
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="edit-transaction-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Edit Transaction</h1>
          <p>Update transaction details</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading transaction...</p>
      </div>

      <!-- Edit Form -->
      <form *ngIf="!loading && editForm" [formGroup]="editForm" (ngSubmit)="onSubmit()" class="edit-form">
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>edit</mat-icon>
              Transaction Details
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <input matInput formControlName="description" placeholder="What was this transaction for?">
                <mat-icon matSuffix>description</mat-icon>
                <mat-error *ngIf="editForm.get('description')?.touched && editForm.get('description')?.invalid">
                  Description is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>Total Amount</mat-label>
                <input matInput type="number" step="0.01" formControlName="amount" placeholder="0.00">
                <span matPrefix>₹&nbsp;</span>
                <mat-error *ngIf="editForm.get('amount')?.touched && editForm.get('amount')?.invalid">
                  Please enter a valid amount
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="category-field">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category">
                  <mat-option value="Food">🍽️ Food & Dining</mat-option>
                  <mat-option value="Transportation">🚗 Transportation</mat-option>
                  <mat-option value="Entertainment">🎬 Entertainment</mat-option>
                  <mat-option value="Shopping">🛍️ Shopping</mat-option>
                  <mat-option value="Utilities">⚡ Utilities</mat-option>
                  <mat-option value="Travel">✈️ Travel</mat-option>
                  <mat-option value="Healthcare">🏥 Healthcare</mat-option>
                  <mat-option value="Other">📝 Other</mat-option>
                </mat-select>
                <mat-error *ngIf="editForm.get('category')?.touched && editForm.get('category')?.invalid">
                  Please select a category
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Participants (Read-only for now) -->
            <div class="participants-section">
              <h4>Participants</h4>
              <div *ngIf="transaction" class="participants-list">
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
                  <div class="participant-amount">
                    <span class="payer-badge">Paid ₹{{ transaction.amount.toFixed(2) }}</span>
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
                  <div class="participant-amount">
                    <span>Owes ₹{{ participant.amount.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="editForm.invalid || saving">
            <mat-spinner *ngIf="saving" diameter="20" class="inline-spinner"></mat-spinner>
            <span *ngIf="!saving">Update Transaction</span>
            <span *ngIf="saving">Updating...</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .edit-transaction-container {
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

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
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

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    .full-width {
      width: 100%;
    }

    .amount-field, .category-field {
      flex: 1;
    }

    .participants-section {
      margin-top: 2rem;

      h4 {
        margin: 0 0 1rem 0;
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
            .payer-badge {
              background-color: #4caf50;
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 20px;
              font-weight: 500;
              font-size: 0.9rem;
            }

            span {
              font-weight: 600;
              color: #666;
            }
          }
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 0;

      @media (max-width: 768px) {
        flex-direction: column-reverse;

        button {
          width: 100%;
        }
      }
    }

    .inline-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .edit-transaction-container {
        padding: 0.5rem;
      }

      .page-header .header-content h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class EditTransactionComponent implements OnInit, OnDestroy {
  editForm!: FormGroup;
  transaction: Transaction | null = null;
  loading = true;
  saving = false;
  transactionId!: number;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.transactionId = Number(this.route.snapshot.paramMap.get('id'));
    this.initializeForm();
    this.loadTransaction();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.editForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', [Validators.required]]
    });
  }

  private loadTransaction(): void {
    this.transactionService.getTransactionById(this.transactionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transaction) => {
          this.transaction = transaction;
          this.populateForm(transaction);
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load transaction:', error);
          this.loading = false;
          this.showMessage('Failed to load transaction', 'error-snackbar');
        }
      });
  }

  private populateForm(transaction: Transaction): void {
    this.editForm.patchValue({
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category
    });
  }

  onSubmit(): void {
    if (this.editForm.valid) {
      this.saving = true;
      
      const updateData: Partial<CreateTransactionRequest> = {
        description: this.editForm.value.description,
        amount: parseFloat(this.editForm.value.amount),
        category: this.editForm.value.category
      };

      this.transactionService.updateTransaction(this.transactionId, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedTransaction) => {
            this.saving = false;
            this.showMessage('Transaction updated successfully!', 'success-snackbar');
            this.router.navigate(['/transactions', this.transactionId]);
          },
          error: (error) => {
            this.saving = false;
            console.error('Failed to update transaction:', error);
            this.showMessage(error.message || 'Failed to update transaction', 'error-snackbar');
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/transactions', this.transactionId]);
  }

  onBack(): void {
    this.router.navigate(['/transactions']);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
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