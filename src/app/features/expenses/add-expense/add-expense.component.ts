import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { ExpenseService, CreateExpenseRequest } from '../../../core/services/expense.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { GroupService, Group } from '../../../core/services/group.service';

@Component({
  selector: 'app-add-expense',
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
    MatAutocompleteModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="add-expense-container">
      <div class="expense-header">
        <button mat-icon-button (click)="onBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Add Expense</h1>
          <p>Split a bill or expense with friends</p>
        </div>
      </div>

      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="expense-form">
        <!-- Basic Details -->
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
                <mat-error *ngIf="expenseForm.get('description')?.touched && expenseForm.get('description')?.invalid">
                  Description is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="amount-field">
                <mat-label>Total Amount</mat-label>
                <input matInput type="number" step="0.01" formControlName="amount" placeholder="0.00">
                <span matPrefix>₹&nbsp;</span>
                <mat-error *ngIf="expenseForm.get('amount')?.touched && expenseForm.get('amount')?.invalid">
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
                <mat-error *ngIf="expenseForm.get('category')?.touched && expenseForm.get('category')?.invalid">
                  Please select a category
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Group Selection (Optional) -->
            <div class="form-row" *ngIf="userGroups.length > 0">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Group (Optional)</mat-label>
                <mat-select formControlName="groupId">
                  <mat-option [value]="null">No Group - Split with individuals</mat-option>
                  <mat-option *ngFor="let group of userGroups" [value]="group.id">
                    {{ group.name }} ({{ group.memberCount }} members)
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Participants -->
        <mat-card class="form-section">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>group</mat-icon>
              Split With
            </mat-card-title>
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
                <span class="payer-badge">Paid ₹{{ getFormattedAmount() }}</span>
              </div>
            </div>

            <!-- Add Participants -->
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
                      <mat-label>Search by email</mat-label>
                      <input matInput 
                             formControlName="userEmail"
                             [matAutocomplete]="auto"
                             placeholder="Enter email to search">
                      <mat-autocomplete #auto="matAutocomplete" 
                                        (optionSelected)="onUserSelected($event, i)">
                        <mat-option *ngFor="let user of searchResults" [value]="user.email">
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
                      </mat-autocomplete>
                    </mat-form-field>
                  </div>
                </div>

                <div class="participant-amount">
                  <mat-form-field appearance="outline" class="amount-input">
                    <mat-label>Amount</mat-label>
                    <input matInput type="number" step="0.01" formControlName="amount" placeholder="0.00">
                    <span matPrefix>₹&nbsp;</span>
                  </mat-form-field>

                  <button mat-icon-button type="button" (click)="onRemoveParticipant(i)" class="remove-button">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add Participant Button -->
            <button mat-stroked-button type="button" (click)="onAddParticipant()" class="add-participant-btn">
              <mat-icon>add</mat-icon>
              Add Another Person
            </button>

            <!-- Split Summary -->
            <div *ngIf="participantsArray.length > 0" class="split-summary">
              <h4>Split Summary</h4>
              <div class="summary-item">
                <span>Total Amount:</span>
                <span class="amount">₹{{ getFormattedAmount() }}</span>
              </div>
              <div class="summary-item">
                <span>Number of People:</span>
                <span>{{ participantsArray.length + 1 }}</span>
              </div>
              <div class="summary-item">
                <span>Assigned Amount:</span>
                <span class="amount">₹{{ getAssignedAmount().toFixed(2) }}</span>
              </div>
              <div class="summary-item">
                <span>Remaining:</span>
                <span class="amount" [class.error]="getRemainingAmount() !== 0">
                  ₹{{ getRemainingAmount().toFixed(2) }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" 
                  [disabled]="expenseForm.invalid || saving || !isValidSplit()">
            <mat-spinner *ngIf="saving" diameter="20" class="inline-spinner"></mat-spinner>
            <span *ngIf="!saving">Create Expense</span>
            <span *ngIf="saving">Creating...</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .add-expense-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    .expense-header {
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

    .expense-form {
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

        .amount-input {
          width: 120px;
        }

        .remove-button {
          color: #f44336;
        }
      }
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

    .search-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #f44336;
      padding: 0.5rem;

      mat-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
      }
    }

    .selected-user {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: relative;
      padding: 0.75rem;
      background-color: #e8f5e8;
      border-radius: 8px;
      border: 1px solid #4caf50;

      .selected-user-name {
        font-weight: 500;
        color: #333;
      }

      .selected-user-email {
        color: #666;
        font-size: 0.85rem;
      }

      .clear-user-btn {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        width: 24px;
        height: 24px;
        color: #666;

        mat-icon {
          font-size: 1rem;
          width: 1rem;
          height: 1rem;
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
      .add-expense-container {
        padding: 0.5rem;
      }

      .expense-header .header-content h1 {
        font-size: 1.5rem;
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
export class AddExpenseComponent implements OnInit, OnDestroy {
  expenseForm: FormGroup;
  userGroups: Group[] = [];
  searchResults: User[] = [];
  saving = false;
  searchLoading = false;
  searchError = '';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private expenseService: ExpenseService,
    private userService: UserService,
    private groupService: GroupService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.expenseForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', [Validators.required]],
      groupId: [null],
      participants: this.formBuilder.array([])
    });
  }

  ngOnInit(): void {
    this.loadUserGroups();
    this.setupUserSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get participantsArray(): FormArray {
    return this.expenseForm.get('participants') as FormArray;
  }

  private loadUserGroups(): void {
    this.groupService.getUserGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups) => {
          this.userGroups = groups;
        },
        error: (error) => {
          console.error('Failed to load groups:', error);
        }
      });
  }

  private setupUserSearch(): void {
    // Initial setup - will be called for each new participant
  }

  private searchUsers(query: string): void {
    if (!query || query.length < 2) {
      this.searchResults = [];
      this.searchError = '';
      return;
    }

    this.searchLoading = true;
    this.searchError = '';
    
    this.userService.searchUsers(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchLoading = false;
          this.searchResults = response.users;
          
          if (response.users.length === 0) {
            this.searchError = 'No users found. Please check if the user is registered.';
          }
        },
        error: (error) => {
          this.searchLoading = false;
          console.error('Search failed:', error);
          this.searchResults = [];
          this.searchError = 'Failed to search users. Please try again.';
        }
      });
  }

  onAddParticipant(): void {
    const participantGroup = this.formBuilder.group({
      userId: ['', [Validators.required]],
      userEmail: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });

    // Setup search for new participant
    participantGroup.get('userEmail')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email && email.length >= 3) {
          this.searchUsers(email);
        }
      });

    this.participantsArray.push(participantGroup);
  }

  onRemoveParticipant(index: number): void {
    this.participantsArray.removeAt(index);
  }

  onUserSelected(event: any, index: number): void {
    const selectedUser = this.searchResults.find(user => user.email === event.option.value);
    if (selectedUser) {
      const participantGroup = this.participantsArray.at(index) as FormGroup;
      participantGroup.patchValue({
        userId: selectedUser.id,
        userEmail: selectedUser.email
      });
    }
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
    if (!userId) return 'U';
    const user = this.searchResults.find(u => u.id === userId);
    return this.getUserInitials(user?.name || '');
  }

  getUserInitials(name: string): string {
    if (!name) return 'U';
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getFormattedAmount(): string {
    const amount = this.expenseForm.get('amount')?.value;
    return amount ? parseFloat(amount).toFixed(2) : '0.00';
  }

  getAssignedAmount(): number {
    let assigned = 0;
    this.participantsArray.controls.forEach(control => {
      const amount = control.get('amount')?.value || 0;
      assigned += parseFloat(amount);
    });
    return assigned;
  }

  getRemainingAmount(): number {
    const totalAmount = this.expenseForm.get('amount')?.value || 0;
    return totalAmount - this.getAssignedAmount();
  }

  isValidSplit(): boolean {
    if (this.participantsArray.length === 0) return false;
    return Math.abs(this.getRemainingAmount()) < 0.01; // Allow for small rounding differences
  }

  onSubmit(): void {
    if (this.expenseForm.valid && this.isValidSplit()) {
      this.saving = true;
      
      const formValue = this.expenseForm.value;
      const participants = formValue.participants.map((p: any) => ({
        userId: p.userId,
        amount: parseFloat(p.amount)
      }));

      const expenseRequest: CreateExpenseRequest = {
        description: formValue.description,
        amount: parseFloat(formValue.amount),
        category: formValue.category,
        groupId: formValue.groupId,
        participants: participants
      };

      this.expenseService.createExpense(expenseRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (expense) => {
            this.saving = false;
            this.showMessage('Expense created successfully!', 'success-snackbar');
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.saving = false;
            console.error('Failed to create expense:', error);
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