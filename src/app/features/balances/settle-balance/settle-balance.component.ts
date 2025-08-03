import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { BalanceService } from '../../../core/services/balance.service';
import { UserService } from '../../../core/services/user.service';
import { CreateSettlementRequest } from '../../../shared/models/balance.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-settle-balance',
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
    <div class="settle-balance-container">
      <div class="settle-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Settle Up</h1>
          <p>Pay back what you owe or record a payment</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading settlement options...</p>
      </div>

      <!-- Settlement Form -->
      <div *ngIf="!loading" class="settlement-content">
        <mat-card class="settlement-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>payment</mat-icon>
              Create Settlement
            </mat-card-title>
            <mat-card-subtitle>Record a payment between users</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="settlementForm" (ngSubmit)="onSubmit()" class="settlement-form">
              <!-- Payment Direction -->
              <div class="payment-direction">
                <h3>Payment Details</h3>
                <div class="direction-options">
                  <button type="button" mat-stroked-button 
                          [class.selected]="paymentDirection === 'paying'"
                          (click)="setPaymentDirection('paying')">
                    <mat-icon>arrow_upward</mat-icon>
                    I am paying someone
                  </button>
                  <button type="button" mat-stroked-button 
                          [class.selected]="paymentDirection === 'receiving'"
                          (click)="setPaymentDirection('receiving')">
                    <mat-icon>arrow_downward</mat-icon>
                    Someone is paying me
                  </button>
                </div>
              </div>

              <!-- User Selection -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ paymentDirection === 'paying' ? 'Pay to' : 'Receive from' }}</mat-label>
                  <mat-select formControlName="otherUserId">
                    <mat-option *ngFor="let user of availableUsers" [value]="user.id">
                      <div class="user-option">
                        <div class="user-avatar-small">
                          {{ getUserInitials(user.name) }}
                        </div>
                        <div class="user-info">
                          <span class="user-name">{{ user.name }}</span>
                          <small class="user-email">{{ user.email }}</small>
                        </div>
                      </div>
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="settlementForm.get('otherUserId')?.touched && settlementForm.get('otherUserId')?.invalid">
                    Please select a user
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Amount -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Amount</mat-label>
                  <input matInput type="number" step="0.01" formControlName="amount" placeholder="0.00">
                  <span matPrefix>$&nbsp;</span>
                  <mat-error *ngIf="settlementForm.get('amount')?.touched && settlementForm.get('amount')?.invalid">
                    Please enter a valid amount
                  </mat-error>
                </mat-form-field>
              </div>

              <!-- Description -->
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description (Optional)</mat-label>
                  <input matInput formControlName="description" placeholder="What is this payment for?">
                  <mat-icon matSuffix>description</mat-icon>
                </mat-form-field>
              </div>

              <!-- Settlement Summary -->
              <div *ngIf="settlementForm.valid" class="settlement-summary">
                <h4>Settlement Summary</h4>
                <div class="summary-content">
                  <div class="summary-item">
                    <mat-icon>{{ paymentDirection === 'paying' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                    <span>
                      {{ paymentDirection === 'paying' ? 'You are paying' : 'You are receiving' }}
                      <strong>${{ settlementForm.get('amount')?.value?.toFixed(2) || '0.00' }}</strong>
                      {{ paymentDirection === 'paying' ? 'to' : 'from' }}
                      <strong>{{ getSelectedUserName() }}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <button mat-button type="button" (click)="onCancel()">Cancel</button>
                <button mat-raised-button color="primary" type="submit" 
                        [disabled]="settlementForm.invalid || saving">
                  <mat-spinner *ngIf="saving" diameter="20" class="inline-spinner"></mat-spinner>
                  <span *ngIf="!saving">Record Settlement</span>
                  <span *ngIf="saving">Recording...</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Quick Settlement Options -->
        <mat-card class="quick-settlements-card" *ngIf="suggestedSettlements.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>flash_on</mat-icon>
              Suggested Settlements
            </mat-card-title>
            <mat-card-subtitle>Quick options based on your current balances</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="suggested-settlements">
              <div *ngFor="let suggestion of suggestedSettlements" class="suggestion-item">
                <div class="suggestion-info">
                  <div class="suggestion-avatar">
                    {{ getUserInitials(suggestion.userName) }}
                  </div>
                  <div class="suggestion-details">
                    <span class="suggestion-text">{{ suggestion.description }}</span>
                    <small class="suggestion-amount">${{ suggestion.amount.toFixed(2) }}</small>
                  </div>
                </div>
                <button mat-stroked-button (click)="onQuickSettle(suggestion)">
                  <mat-icon>flash_on</mat-icon>
                  Quick Settle
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .settle-balance-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 1rem;
    }

    .settle-header {
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

    .settlement-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .settlement-card, .quick-settlements-card {
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

    .settlement-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .payment-direction {
      h3 {
        margin: 0 0 1rem 0;
        color: #333;
        font-weight: 600;
      }

      .direction-options {
        display: flex;
        gap: 1rem;

        @media (max-width: 768px) {
          flex-direction: column;
        }

        button {
          flex: 1;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;

          &.selected {
            background-color: rgba(63, 81, 181, 0.1);
            border-color: #3f51b5;
            color: #3f51b5;
          }

          &:hover {
            background-color: rgba(63, 81, 181, 0.04);
          }
        }
      }
    }

    .form-row {
      display: flex;
      gap: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .full-width {
      width: 100%;
    }

    .user-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;

      .user-avatar-small {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      .user-info {
        display: flex;
        flex-direction: column;

        .user-name {
          font-weight: 500;
          color: #333;
        }

        .user-email {
          color: #666;
          font-size: 0.85rem;
        }
      }
    }

    .settlement-summary {
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #3f51b5;

      h4 {
        margin: 0 0 1rem 0;
        color: #333;
        font-weight: 600;
      }

      .summary-content {
        .summary-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          mat-icon {
            color: #3f51b5;
          }

          span {
            color: #666;

            strong {
              color: #333;
              font-weight: 600;
            }
          }
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;

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

    .suggested-settlements {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .suggestion-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        transition: all 0.2s ease;

        &:hover {
          border-color: #e0e0e0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .suggestion-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;

          .suggestion-avatar {
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
            flex-shrink: 0;
          }

          .suggestion-details {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .suggestion-text {
              font-weight: 500;
              color: #333;
            }

            .suggestion-amount {
              color: #666;
              font-size: 0.9rem;
            }
          }
        }

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
      }
    }

    @media (max-width: 768px) {
      .settle-balance-container {
        padding: 0.5rem;
      }

      .settle-header .header-content h1 {
        font-size: 1.5rem;
      }

      .suggested-settlements .suggestion-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        button {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class SettleBalanceComponent implements OnInit, OnDestroy {
  settlementForm: FormGroup;
  availableUsers: User[] = [];
  suggestedSettlements: any[] = [];
  paymentDirection: 'paying' | 'receiving' = 'paying';
  loading = true;
  saving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private balanceService: BalanceService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.settlementForm = this.formBuilder.group({
      otherUserId: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFormattedSettlementAmount(): string {
    const amount = this.settlementForm.get('amount')?.value;
    return amount ? amount.toFixed(2) : '0.00';
  }

  private loadData(): void {
    // Load available users and suggested settlements
    // For now, we'll use mock data
    this.availableUsers = [
      { id: 2, name: 'John Doe', email: 'john@example.com' },
      { id: 3, name: 'Jane Smith', email: 'jane@example.com' }
    ];

    this.suggestedSettlements = [
      {
        userId: 2,
        userName: 'John Doe',
        amount: 25.50,
        description: 'Settle up with John Doe'
      },
      {
        userId: 3,
        userName: 'Jane Smith',
        amount: 15.75,
        description: 'Settle up with Jane Smith'
      }
    ];

    this.loading = false;
  }

  setPaymentDirection(direction: 'paying' | 'receiving'): void {
    this.paymentDirection = direction;
  }

  getSelectedUserName(): string {
    const selectedUserId = this.settlementForm.get('otherUserId')?.value;
    const user = this.availableUsers.find(u => u.id === selectedUserId);
    return user?.name || '';
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  onQuickSettle(suggestion: any): void {
    this.settlementForm.patchValue({
      otherUserId: suggestion.userId,
      amount: suggestion.amount,
      description: suggestion.description
    });
    this.paymentDirection = 'paying';
  }

  onSubmit(): void {
    if (this.settlementForm.valid) {
      this.saving = true;
      
      const currentUser = this.authService.getCurrentUserValue();
      if (!currentUser) {
        this.saving = false;
        return;
      }

      const formValue = this.settlementForm.value;
      
      const settlementRequest: CreateSettlementRequest = {
        fromUserId: this.paymentDirection === 'paying' ? currentUser.id : formValue.otherUserId,
        toUserId: this.paymentDirection === 'paying' ? formValue.otherUserId : currentUser.id,
        amount: parseFloat(formValue.amount),
        description: formValue.description || `Settlement between users`
      };

      this.balanceService.createSettlement(settlementRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (settlement) => {
            this.saving = false;
            this.showMessage('Settlement recorded successfully!', 'success-snackbar');
            this.router.navigate(['/balances']);
          },
          error: (error) => {
            this.saving = false;
            console.error('Failed to create settlement:', error);
            this.showMessage('Failed to record settlement. Please try again.', 'error-snackbar');
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/balances']);
  }

  onBack(): void {
    this.router.navigate(['/balances']);
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