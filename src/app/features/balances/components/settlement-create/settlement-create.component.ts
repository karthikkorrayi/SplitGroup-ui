import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BalanceService } from '../../../../core/services/balance.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Balance } from '../../../../core/models/balance.model';

@Component({
  selector: 'app-settlement-create',
  templateUrl: './settlement-create.component.html',
  styleUrls: ['./settlement-create.component.scss']
})
export class SettlementCreateComponent implements OnInit {
  settlementForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private balanceService: BalanceService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<SettlementCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { balance: Balance }
  ) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    const maxAmount = this.getDisplayAmount();
    
    this.settlementForm = this.fb.group({
      amount: [maxAmount, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(maxAmount)
      ]]
    });
  }

  getFriendName(): string {
    const currentUserId = this.authService.getCurrentUser()?.userId;
    return this.data.balance.user1 === currentUserId 
      ? this.data.balance.user2Name 
      : this.data.balance.user1Name;
  }

  isOwedToMe(): boolean {
    const currentUserId = this.authService.getCurrentUser()?.userId;
    if (this.data.balance.user1 === currentUserId) {
      return this.data.balance.amount > 0;
    } else {
      return this.data.balance.amount < 0;
    }
  }

  getDisplayAmount(): number {
    return Math.abs(this.data.balance.amount);
  }

  getPayerName(): string {
    if (this.isOwedToMe()) {
      return this.getFriendName();
    } else {
      return this.authService.getCurrentUser()?.name || 'You';
    }
  }

  getReceiverName(): string {
    if (this.isOwedToMe()) {
      return this.authService.getCurrentUser()?.name || 'You';
    } else {
      return this.getFriendName();
    }
  }

  onSettle() {
    if (this.settlementForm.valid) {
      this.isLoading = true;
      
      const currentUserId = this.authService.getCurrentUser()!.userId;
      const settlementData = {
        fromUserId: this.isOwedToMe() 
          ? (this.data.balance.user1 === currentUserId ? this.data.balance.user2 : this.data.balance.user1)
          : currentUserId,
        toUserId: this.isOwedToMe() 
          ? currentUserId 
          : (this.data.balance.user1 === currentUserId ? this.data.balance.user2 : this.data.balance.user1),
        amount: this.settlementForm.value.amount
      };

      this.balanceService.createSettlement(settlementData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Settlement created successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close('settled');
        },
        error: (error) => {
          this.isLoading = false;
          // Error handling done by interceptor
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}