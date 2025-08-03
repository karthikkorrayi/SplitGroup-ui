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
  templateUrl: './settle-balance.component.html',
  styleUrl: './settle-balance.component.scss'
})
export class SettleBalanceComponent implements OnInit, OnDestroy {
  settlementForm: FormGroup;
  availableUsers: User[] = [];
  suggestedSettlements: any[] = [];
  paymentDirection: 'paying' | 'receiving' = 'paying';
  loading = true;
  saving = false;

  private destroy$ = new Subject<void>();
  formattedSettlementAmountDisplay = '0.00';

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
    
    // Subscribe to amount changes to update formatted display
    this.settlementForm.get('amount')?.valueChanges.subscribe(value => {
      this.formattedSettlementAmountDisplay = parseFloat(value || 0).toFixed(2);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatAmountForDisplay(amount: number): string {
    return amount.toFixed(2);
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