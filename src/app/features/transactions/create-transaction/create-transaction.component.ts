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
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { UserService } from '../../../core/services/user.service';
import { CreateTransactionRequest, SplitType, TransactionParticipant } from '../../../shared/models/transaction.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-create-transaction',
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
    MatRadioModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="create-transaction-container">
      <div class="transaction-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Add Expense</h1>
          <p>Split a bill or expense with friends</p>
        </div>
      </div>

      <form [formGroup]="transactionForm" (ngSubmit)="onSubmit()" class="transaction-form">
        <!-- Basic Information -->
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
                <mat-error *ngIf="transactionForm.get('description')?.touched && transactionForm.get('description')?.invalid">
                  Description is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>Total Amount</mat-label>
                <input matInput type="number" step="0.01" formControlName="amount" placeholder="0.00">
                <span matPrefix>$&nbsp;</span>
                <mat-error *ngIf="transactionForm.get('amount')?.touched && transactionForm.get('amount')?.invalid">
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
                <mat-error *ngIf="transactionForm.get('category')?.touched && transactionForm.get('category')?.invalid">
                  Please select a category
                </mat-error>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Split Type -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>call_split</mat-icon>
              How to Split
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <mat-radio-group formControlName="splitType" class="split-type-group">
              <mat-radio-button value="EQUAL" class="split-option">
                <div class="split-option-content">
                  <div class="split-option-header">
                    <mat-icon>people</mat-icon>
                    <span class="split-title">Split Equally</span>
                  </div>
                  <small>Everyone pays the same amount</small>
                </div>
              </mat-radio-button>

              <mat-radio-button value="EXACT" class="split-option">
                <div class="split-option-content">
                  <div class="split-option-header">
                    <mat-icon>calculate</mat-icon>
                    <span class="split-title">Exact Amounts</span>
                  </div>
                  <small>Enter specific amounts for each person</small>
                </div>
              </mat-radio-button>

              <mat-radio-button value="PERCENTAGE" class="split-option">
                <div class="split-option-content">
                  <div class="split-option-header">
                    <mat-icon>percent</mat-icon>
                    <span class="split-title">By Percentage</span>
                  </div>
                  <small>Split by percentage of total</small>
                </div>
              </mat-radio-button>
            </mat-radio-group>
          </mat-card-content>
        </mat-card>

        <!-- Participants -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>group</mat-icon>
              Participants
            </mat-card-title>
            <div class="spacer"></div>
            <button mat-button type="button" (click)="onAddParticipant()" [disabled]="!canAddParticipant()">
              <mat-icon>person_add</mat-icon>
              Add Person
            </button>
          </mat-card-header>

          <mat-card-content>
            <!-- Current User (Payer) -->
            <div class="participant-item payer">
              <div class="participant-info">
                <div class="participant-avatar">
                  {{ getCurrentUserInitials() }}
                </div>
                <div class="participant-details">
                  <span class="participant-name">{{ getCurrentUserName() }} (You)</span>
                  <small>Paid the bill</small>
                </div>
              </div>
              <div class="participant-amount">
                <span class="payer-badge">Paid $ {{ getFormattedAmount() }}</span>
              </div>
            </div>

            <!-- Other Participants -->
            <div formArrayName="participants">
              <div *ngFor="let participant of participantsArray.controls; let i = index" 
                   [formGroupName]="i" 
                   class="participant-item">
                
                <div class="participant-info">
                  <div class="participant-avatar">
                    {{ getParticipantInitials(participant.get('userId')?.value) }}
                  </div>
                  <div class="participant-details">
                    <mat-form-field appearance="outline" class="participant-select">
                      <mat-label>Select Person</mat-label>
                      <mat-select formControlName="userId">
                        <mat-option *ngFor="let user of availableUsers" [value]="user.id">
                          {{ user.name }} ({{ user.email }})
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="participant-amount">
                  <!-- Equal Split - Show calculated amount -->
                  <div *ngIf="splitType === 'EQUAL'" class="calculated-amount">
                    $ {{ getEqualSplitAmount() }}
                  </div>

                  <!-- Exact Amount -->
                  <mat-form-field *ngIf="splitType === 'EXACT'" appearance="outline" class="amount-input">
                    <mat-label>Amount</mat-label>
                    <input matInput type="number" step="0.01" formControlName="amount" placeholder="0.00">
                    <span matPrefix>$&nbsp;</span>
                  </mat-form-field>

                  <!-- Percentage -->
                  <mat-form-field *ngIf="splitType === 'PERCENTAGE'" appearance="outline" class="percentage-input">
                    <mat-label>Percentage</mat-label>
                    <input matInput type="number" step="0.1" formControlName="percentage" placeholder="0">
                    <span matSuffix>%</span>
                  </mat-form-field>

                  <button mat-icon-button type="button" (click)="onRemoveParticipant(i)" class="remove-button">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Participant Button -->
            <button mat-stroked-button type="button" (click)="onAddParticipant()" class="add-participant-btn" [disabled]="!canAddParticipant()">
              <mat-icon>add</mat-icon>
              Add Another Person
            </button>

            <!-- Split Summary -->
            <div *ngIf="participantsArray.length > 0" class="split-summary">
              <h4>Split Summary</h4>
              <div class="summary-item">
                <span>Total Amount:</span>
                <span class="amount">$ {{ getFormattedAmount() }}</span>
              </div>
              <div class="summary-item">
                <span>Number of People:</span>
                <span>{{ participantsArray.length + 1 }}</span>
              </div>
              <div *ngIf="splitType === 'EQUAL'" class="summary-item">
                <span>Amount per Person:</span>
                <span class="amount">$ {{ getEqualSplitAmount() }}</span>
              </div>
              <div *ngIf="splitType !== 'EQUAL'" class="summary-item">
                <span>Remaining to Assign:</span>
                <span class="amount" [class.error]="getRemainingAmount() !== 0">
                  $ {{ getRemainingAmount().toFixed(2) }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="transactionForm.invalid || saving || !isValidSplit()">
            <mat-spinner *ngIf="saving" diameter="20" class="inline-spinner"></mat-spinner>
            <span *ngIf="!saving">Create Expense</span>
            <span *ngIf="saving">Creating...</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-transaction-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .transaction-header {
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

    .transaction-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
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

    .amount-field {
      flex: 1;
    }

    .category-field {
      flex: 1;
    }

    .split-type-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .split-option {
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3f51b5;
        background-color: rgba(63, 81, 181, 0.04);
      }

      &.mat-radio-checked {
        border-color: #3f51b5;
        background-color: rgba(63, 81, 181, 0.08);
      }
    }

    .split-option-content {
      margin-left: 2rem;
    }

    .split-option-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;

      .split-title {
        font-weight: 500;
        color: #333;
      }
    }

    .participant-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      margin-bottom: 1rem;

      &.payer {
        background-color: rgba(76, 175, 80, 0.08);
        border-color: rgba(76, 175, 80, 0.3);
      }

      .participant-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;

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
          flex-shrink: 0;
        }

        .participant-details {
          flex: 1;

          .participant-name {
            font-weight: 500;
            color: #333;
            display: block;
          }

          small {
            color: #666;
            font-size: 0.85rem;
          }

          .participant-select {
            width: 100%;
            margin-top: 0.5rem;
          }
        }
      }

      .participant-amount {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .payer-badge {
          background-color: #4caf50;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .calculated-amount {
          font-weight: 600;
          color: #333;
          font-size: 1.1rem;
        }

        .amount-input, .percentage-input {
          width: 120px;
        }

        .remove-button {
          color: #f44336;
        }
      }
    }

    .add-participant-btn {
      width: 100%;
      padding: 1rem;
      border-style: dashed;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .split-summary {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;

      h4 {
        margin: 0 0 1rem 0;
        color: #333;
        font-weight: 600;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;

        &:last-child {
          margin-bottom: 0;
        }

        .amount {
          font-weight: 600;

          &.error {
            color: #f44336;
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
      .create-transaction-container {
        padding: 0.5rem;
      }

      .transaction-header {
        .header-content h1 {
          font-size: 1.5rem;
        }
      }

      .participant-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;

        .participant-amount {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  `]
})
export class CreateTransactionComponent implements OnInit, OnDestroy {
  transactionForm: FormGroup;
  availableUsers: User[] = [];
  saving = false;
  splitType: SplitType = SplitType.EQUAL;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private transactionService: TransactionService,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.transactionForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', [Validators.required]],
      splitType: [SplitType.EQUAL, [Validators.required]],
      participants: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.loadAvailableUsers();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get participantsArray(): FormArray {
    return this.transactionForm.get('participants') as FormArray;
  }

  private setupFormSubscriptions(): void {
    this.transactionForm.get('splitType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(splitType => {
        this.splitType = splitType;
        this.updateParticipantControls();
      });
  }

  private loadAvailableUsers(): void {
    // For now, we'll use a mock list. In a real app, you might load recent users or friends
    this.availableUsers = [];
  }

  private updateParticipantControls(): void {
    this.participantsArray.controls.forEach(control => {
      const group = control as FormGroup;
      
      // Remove existing amount/percentage controls
      if (group.contains('amount')) {
        group.removeControl('amount');
      }
      if (group.contains('percentage')) {
        group.removeControl('percentage');
      }

      // Add appropriate control based on split type
      if (this.splitType === SplitType.EXACT) {
        group.addControl('amount', this.formBuilder.control('', [Validators.required, Validators.min(0.01)]));
      } else if (this.splitType === SplitType.PERCENTAGE) {
        group.addControl('percentage', this.formBuilder.control('', [Validators.required, Validators.min(0.1), Validators.max(100)]));
      }
    });
  }

  onAddParticipant(): void {
    const participantGroup = this.formBuilder.group({
      userId: ['', [Validators.required]]
    });

    // Add amount or percentage control based on split type
    if (this.splitType === SplitType.EXACT) {
      participantGroup.addControl('amount', this.formBuilder.control('', [Validators.required, Validators.min(0.01)]));
    } else if (this.splitType === SplitType.PERCENTAGE) {
      participantGroup.addControl('percentage', this.formBuilder.control('', [Validators.required, Validators.min(0.1), Validators.max(100)]));
    }

    this.participantsArray.push(participantGroup);
  }

  onRemoveParticipant(index: number): void {
    this.participantsArray.removeAt(index);
  }

  canAddParticipant(): boolean {
    return this.availableUsers.length > this.participantsArray.length;
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUserValue();
    return user?.name || 'You';
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

  getParticipantInitials(userId: number): string {
    const user = this.availableUsers.find(u => u.id === userId);
    if (!user?.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getFormattedAmount(): string {
    const amount = this.transactionForm.get('amount')?.value;
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  }

  getEqualSplitAmount(): string {
    const totalAmount = this.transactionForm.get('amount')?.value || 0;
    const participantCount = this.participantsArray.length + 1; // +1 for current user
    return participantCount > 0 ? (totalAmount / participantCount).toFixed(2) : '0.00';
  }

  getRemainingAmount(): number {
    const totalAmount = this.transactionForm.get('amount')?.value || 0;
    let assignedAmount = 0;

    if (this.splitType === SplitType.EXACT) {
      this.participantsArray.controls.forEach(control => {
        const amount = control.get('amount')?.value || 0;
        assignedAmount += parseFloat(amount);
      });
    } else if (this.splitType === SplitType.PERCENTAGE) {
      let totalPercentage = 0;
      this.participantsArray.controls.forEach(control => {
        const percentage = control.get('percentage')?.value || 0;
        totalPercentage += parseFloat(percentage);
      });
      assignedAmount = (totalAmount * totalPercentage) / 100;
    }

    return totalAmount - assignedAmount;
  }

  isValidSplit(): boolean {
    if (this.splitType === SplitType.EQUAL) {
      return this.participantsArray.length > 0;
    }
    
    return Math.abs(this.getRemainingAmount()) < 0.01; // Allow for small rounding differences
  }

  onSubmit(): void {
    if (this.transactionForm.valid && this.isValidSplit()) {
      this.saving = true;
      
      const currentUser = this.authService.getCurrentUserValue();
      if (!currentUser) {
        this.saving = false;
        return;
      }

      const formValue = this.transactionForm.value;
      const participants: TransactionParticipant[] = [];

      // Add current user as participant
      if (this.splitType === SplitType.EQUAL) {
        participants.push({
          userId: currentUser.id,
          amount: parseFloat(this.getEqualSplitAmount())
        });
      }

      // Add other participants
      formValue.participants.forEach((participant: any) => {
        const participantData: TransactionParticipant = {
          userId: participant.userId
        };

        if (this.splitType === SplitType.EQUAL) {
          participantData.amount = parseFloat(this.getEqualSplitAmount());
        } else if (this.splitType === SplitType.EXACT) {
          participantData.amount = parseFloat(participant.amount);
        } else if (this.splitType === SplitType.PERCENTAGE) {
          participantData.percentage = parseFloat(participant.percentage);
        }

        participants.push(participantData);
      });

      const transactionRequest: CreateTransactionRequest = {
        description: formValue.description,
        amount: parseFloat(formValue.amount),
        category: formValue.category,
        splitType: formValue.splitType,
        participants: participants
      };

      this.transactionService.createTransaction(transactionRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (transaction) => {
            this.saving = false;
            this.showMessage('Expense created successfully!', 'success-snackbar');
            this.router.navigate(['/transactions']);
          },
          error: (error) => {
            this.saving = false;
            console.error('Failed to create transaction:', error);
            this.showMessage('Failed to create expense. Please try again.', 'error-snackbar');
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  onBack(): void {
    this.router.navigate(['/dashboard']);
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