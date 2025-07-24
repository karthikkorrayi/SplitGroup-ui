import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BalanceService } from '../../../../core/services/balance.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Balance } from '../../../../core/models/balance.model';
import { SettlementCreateComponent } from '../settlement-create/settlement-create.component';

interface BalanceSummary {
  totalOwed: number;
  totalOwing: number;
}

@Component({
  selector: 'app-balance-list',
  templateUrl: './balance-list.component.html',
  styleUrls: ['./balance-list.component.scss']
})
export class BalanceListComponent implements OnInit {
  balances: Balance[] = [];
  balanceSummary: BalanceSummary | null = null;
  isLoading = true;

  constructor(
    private balanceService: BalanceService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadBalances();
  }

  loadBalances() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.balanceService.getUserBalances(currentUser.userId).subscribe({
        next: (balances) => {
          this.balances = balances;
          this.calculateBalanceSummary();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading balances:', error);
          this.isLoading = false;
        }
      });
    }
  }

  calculateBalanceSummary() {
    const userId = this.authService.getCurrentUser()!.userId;
    
    let totalOwed = 0;
    let totalOwing = 0;
    
    this.balances.forEach(balance => {
      if (!balance.isSettled) {
        if (this.isOwedToMe(balance)) {
          totalOwed += Math.abs(balance.amount);
        } else {
          totalOwing += Math.abs(balance.amount);
        }
      }
    });
    
    this.balanceSummary = { totalOwed, totalOwing };
  }

  getFriendName(balance: Balance): string {
    const currentUserId = this.authService.getCurrentUser()?.userId;
    return balance.user1 === currentUserId ? balance.user2Name : balance.user1Name;
  }

  isOwedToMe(balance: Balance): boolean {
    const currentUserId = this.authService.getCurrentUser()?.userId;
    if (balance.user1 === currentUserId) {
      return balance.amount > 0;
    } else {
      return balance.amount < 0;
    }
  }

  getDisplayAmount(balance: Balance): number {
    return Math.abs(balance.amount);
  }

  getBalanceDirection(balance: Balance): string {
    return this.isOwedToMe(balance) ? 'owes you' : 'you owe';
  }

  get netBalance(): number {
    if (!this.balanceSummary) return 0;
    return this.balanceSummary.totalOwed - this.balanceSummary.totalOwing;
  }

  openSettlementDialog(balance: Balance) {
    const dialogRef = this.dialog.open(SettlementCreateComponent, {
      width: '400px',
      data: { balance }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'settled') {
        this.loadBalances(); // Reload balances after settlement
      }
    });
  }
}