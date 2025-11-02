import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ExpenseSplitService, ExpenseSplitRequest, ExpenseSplitResponse } from '../../../core/services/expense-split.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-split-expense',
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="split-expense-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Split Expense</h1>
          <p>Split an expense among multiple participants using email addresses</p>
        </div>
      </div>

      <!-- Split Form -->
      <form [formGroup]="splitForm" (ngSubmit)="onSubmit()" class="split-form">
        
        <!-- Expense Details -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>receipt</mat-icon>
              Expense Details
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <input matInput formControlName="description" placeholder="What was this expense for?">
                <mat-icon matSuffix>description</mat-icon>
                <mat-error *ngIf="splitForm.get('description')?.touched && splitForm.get('description')?.invalid">
                  Description is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>Total Amount</mat-label>
                <input matInput type="number" step="0.01" formControlName="totalAmount" placeholder="0.00">
                <span matPrefix>₹&nbsp;</span>
                <mat-error *ngIf="splitForm.get('totalAmount')?.touched && splitForm.get('totalAmount')?.invalid">
                  Please enter a valid amount greater than 0
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
                <mat-error *ngIf="splitForm.get('category')?.touched && splitForm.get('category')?.invalid">
                  Please select a category
                </mat-error>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Participants -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>group</mat-icon>
              Participants (Email Addresses)
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <!-- Current User Info -->
            <div class="current-user-info">
              <div class="user-avatar">
                {{ getCurrentUserInitials() }}
              </div>
              <div class="user-details">
                <span class="user-name">{{ getCurrentUserName() }} (You - Payer)</span>
                <span class="user-email">{{ getCurrentUserEmail() }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Participant Emails -->
            <div formArrayName="participantEmails" class="participants-section">
              <h4>Add Participants by Email:</h4>
              
              <div *ngFor="let emailControl of participantEmailsArray.controls; let i = index" 
                   class="email-input-row">
                <mat-form-field appearance="outline" class="email-field">
                  <mat-label>Participant Email {{ i + 1 }}</mat-label>
                  <input matInput type="email" [formControlName]="i" placeholder="Enter email address">
                  <mat-icon matSuffix>email</mat-icon>
                  <mat-error *ngIf="emailControl.touched && emailControl.invalid">
                    Please enter a valid email address
                  </mat-error>
                </mat-form-field>
                
                <button mat-icon-button type="button" (click)="removeParticipantEmail(i)" 
                        class="remove-button" [disabled]="participantEmailsArray.length <= 1">
                  <mat-icon>remove_circle</mat-icon>
                </button>
              </div>

              <button mat-stroked-button type="button" (click)="addParticipantEmail()" 
                      class="add-email-btn">
                <mat-icon>add</mat-icon>
                Add Another Email
              </button>
            </div>

            <!-- Split Preview -->
            <div *ngIf="splitForm.get('totalAmount')?.value > 0 && participantEmailsArray.length > 0" 
                 class="split-preview">
              <h4>Split Preview:</h4>
              <div class="preview-item">
                <span>Total Amount:</span>
                <span class="amount">₹{{ getFormattedAmount() }}</span>
              </div>
              <div class="preview-item">
                <span>Number of People:</span>
                <span>{{ getTotalParticipants() }}</span>
              </div>
              <div class="preview-item">
                <span>Amount per Person:</span>
                <span class="amount">₹{{ getAmountPerPerson() }}</span>
              </div>
              <div *ngIf="getRemainder() > 0" class="preview-item remainder">
                <span>Remainder (assigned to payer):</span>
                <span class="amount">₹{{ getRemainder().toFixed(2) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="splitForm.invalid || processing">
            <mat-spinner *ngIf="processing" diameter="20" class="inline-spinner"></mat-spinner>
            <span *ngIf="!processing">Split Expense</span>
            <span *ngIf="processing">Processing...</span>
          </button>
        </div>
      </form>

      <!-- Success Result -->
      <mat-card *ngIf="splitResult && splitResult.status === 'success'" class="result-card success">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>check_circle</mat-icon>
            Expense Split Successfully!
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="result-details">
            <div class="detail-item">
              <span class="label">Total Amount:</span>
              <span class="value">₹{{ splitResult.totalAmount?.toFixed(2) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Participants:</span>
              <span class="value">{{ splitResult.participantCount }} people</span>
            </div>
            <div class="detail-item">
              <span class="label">Paid By:</span>
              <span class="value">{{ splitResult.paidBy?.userName }}</span>
            </div>
          </div>

          <div class="participants-breakdown">
            <h4>Split Breakdown:</h4>
            <div *ngFor="let participant of splitResult.participants" class="participant-split">
              <div class="participant-info">
                <div class="participant-avatar">
                  {{ getInitials(participant.userName) }}
                </div>
                <div class="participant-details">
                  <span class="name">{{ participant.userName }}</span>
                  <span class="email">{{ participant.userEmail }}</span>
                </div>
              </div>
              <div class="split-amount">
                ₹{{ participant.splitAmount.toFixed(2) }}
              </div>
            </div>
          </div>

          <div *ngIf="splitResult.remainderHandling?.hasRemainder" class="remainder-info">
            <mat-icon>info</mat-icon>
            <span>Remainder of ₹{{ splitResult.remainderHandling?.remainderAmount?.toFixed(2) }} 
                  assigned to {{ splitResult.remainderHandling?.assignedTo }}</span>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="viewTransactions()">
            View Transactions
          </button>
          <button mat-button (click)="createAnother()">
            Split Another Expense
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Error Result -->
      <mat-card *ngIf="splitResult && splitResult.status === 'failure'" class="result-card error">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>error</mat-icon>
            Expense Split Failed
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="error-message">{{ splitResult.message }}</p>
          <div *ngIf="splitResult.errors && splitResult.errors.length > 0" class="error-list">
            <h4>Issues found:</h4>
            <ul>
              <li *ngFor="let error of splitResult.errors">{{ error }}</li>
            </ul>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="tryAgain()">
            Try Again
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .split-expense-container {
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

    .split-form {
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

    .current-user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: rgba(76, 175, 80, 0.08);
      border-radius: 8px;
      margin-bottom: 1rem;

      .user-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 1rem;
      }

      .user-details {
        display: flex;
        flex-direction: column;

        .user-name {
          font-weight: 600;
          color: #333;
        }

        .user-email {
          color: #666;
          font-size: 0.9rem;
        }
      }
    }

    .participants-section {
      h4 {
        margin: 1rem 0;
        color: #333;
        font-weight: 600;
      }

      .email-input-row {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 1rem;

        .email-field {
          flex: 1;
        }

        .remove-button {
          color: #f44336;
          margin-top: 0.5rem;
        }
      }

      .add-email-btn {
        width: 100%;
        padding: 1rem;
        border-style: dashed;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
    }

    .split-preview {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;

      h4 {
        margin: 0 0 1rem 0;
        color: #333;
        font-weight: 600;
      }

      .preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }

        &.remainder {
          color: #ff9800;
          font-weight: 500;
        }

        .amount {
          font-weight: 600;
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

    .result-card {
      margin-top: 2rem;

      &.success {
        border-left: 4px solid #4caf50;

        mat-card-title {
          color: #4caf50;
        }
      }

      &.error {
        border-left: 4px solid #f44336;

        mat-card-title {
          color: #f44336;
        }
      }

      .result-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;

        .detail-item {
          display: flex;
          justify-content: space-between;

          .label {
            font-weight: 500;
            color: #666;
          }

          .value {
            font-weight: 600;
            color: #333;
          }
        }
      }

      .participants-breakdown {
        h4 {
          margin: 1rem 0;
          color: #333;
          font-weight: 600;
        }

        .participant-split {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          margin-bottom: 0.5rem;

          .participant-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .participant-avatar {
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
            }

            .participant-details {
              display: flex;
              flex-direction: column;

              .name {
                font-weight: 500;
                color: #333;
              }

              .email {
                color: #666;
                font-size: 0.85rem;
              }
            }
          }

          .split-amount {
            font-weight: 600;
            color: #3f51b5;
          }
        }
      }

      .remainder-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background-color: #fff3cd;
        border-radius: 8px;
        margin-top: 1rem;
        color: #856404;

        mat-icon {
          color: #ff9800;
        }
      }

      .error-message {
        color: #f44336;
        font-weight: 500;
        margin-bottom: 1rem;
      }

      .error-list {
        h4 {
          color: #f44336;
          margin: 0 0 0.5rem 0;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;

          li {
            color: #f44336;
            margin-bottom: 0.25rem;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .split-expense-container {
        padding: 0.5rem;
      }

      .page-header .header-content h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class SplitExpenseComponent implements OnInit, OnDestroy {
  splitForm: FormGroup;
  processing = false;
  splitResult: ExpenseSplitResponse | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private expenseSplitService: ExpenseSplitService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.splitForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      totalAmount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', [Validators.required]],
      participantEmails: this.formBuilder.array([
        this.formBuilder.control('', [Validators.required, Validators.email])
      ])
    });
  }

  ngOnInit(): void {
    // Initialize with one email field
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get participantEmailsArray(): FormArray {
    return this.splitForm.get('participantEmails') as FormArray;
  }

  addParticipantEmail(): void {
    const emailControl = this.formBuilder.control('', [Validators.required, Validators.email]);
    this.participantEmailsArray.push(emailControl);
  }

  removeParticipantEmail(index: number): void {
    if (this.participantEmailsArray.length > 1) {
      this.participantEmailsArray.removeAt(index);
    }
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUserValue();
    return user?.name || 'You';
  }

  getCurrentUserEmail(): string {
    const user = this.authService.getCurrentUserValue();
    return user?.email || '';
  }

  getCurrentUserInitials(): string {
    const user = this.authService.getCurrentUserValue();
    if (!user?.name) return 'Y';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getFormattedAmount(): string {
    const amount = this.splitForm.get('totalAmount')?.value;
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  }

  getTotalParticipants(): number {
    return this.participantEmailsArray.length + 1; // +1 for current user
  }

  getAmountPerPerson(): string {
    const totalAmount = this.splitForm.get('totalAmount')?.value || 0;
    const participants = this.getTotalParticipants();
    if (participants === 0) return '0.00';
    
    const amountPerPerson = totalAmount / participants;
    return amountPerPerson.toFixed(2);
  }

  getRemainder(): number {
    const totalAmount = this.splitForm.get('totalAmount')?.value || 0;
    const participants = this.getTotalParticipants();
    if (participants === 0) return 0;
    
    const baseAmount = Math.floor((totalAmount * 100) / participants) / 100;
    const remainder = Math.round((totalAmount - (baseAmount * participants)) * 100) / 100;
    return remainder;
  }

  onSubmit(): void {
    if (this.splitForm.valid) {
      this.processing = true;
      this.splitResult = null;

      const formValue = this.splitForm.value;
      const request: ExpenseSplitRequest = {
        participantEmails: formValue.participantEmails.filter((email: string) => email.trim()),
        totalAmount: parseFloat(formValue.totalAmount),
        description: formValue.description,
        category: formValue.category
      };

      console.log('Submitting expense split request:', request);

      this.expenseSplitService.splitExpense(request)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            console.log('Expense split result:', result);
            this.processing = false;
            this.splitResult = result;
            
            if (result.status === 'success') {
              this.showMessage('Expense split successfully!', 'success-snackbar');
            }
          },
          error: (error) => {
            console.error('Expense split failed:', error);
            this.processing = false;
            this.splitResult = error;
            this.showMessage('Failed to split expense. Please check the details and try again.', 'error-snackbar');
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.splitForm.controls).forEach(key => {
      const control = this.splitForm.get(key);
      control?.markAsTouched();
    });

    // Mark email controls as touched
    this.participantEmailsArray.controls.forEach(control => {
      control.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
  }

  viewTransactions(): void {
    this.router.navigate(['/transactions']);
  }

  createAnother(): void {
    this.splitResult = null;
    this.splitForm.reset();
    this.splitForm.patchValue({
      category: '',
      participantEmails: ['']
    });
  }

  tryAgain(): void {
    this.splitResult = null;
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