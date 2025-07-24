import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { BalanceService } from '../../../../core/services/balance.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { User } from '../../../../core/models/user.model';
import { Balance } from '../../../../core/models/balance.model';
import { Transaction } from '../../../../core/models/transaction.model';

interface BalanceSummary {
  totalOwed: number;
  totalOwing: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  userBalances: Balance[] = [];
  recentTransactions: Transaction[] = [];
  balanceSummary: BalanceSummary | null = null;
  
  isLoading = true;
  isLoadingBalances = true;
  isLoadingTransactions = true;

  constructor(
    private authService: AuthService,
    private balanceService: BalanceService,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadDashboardData();
    }
  }

  loadDashboardData() {
    const userId = this.currentUser!.userId;
    
    // Load balances and transactions in parallel
    forkJoin({
      balances: this.balanceService.getUserBalances(userId),
      transactions: this.transactionService.getUserTransactions(userId)
    }).subscribe({
      next: (data) => {
        this.userBalances = data.balances;
        this.recentTransactions = data.transactions.slice(0, 5); // Last 5 transactions
        this.calculateBalanceSummary();
        
        this.isLoading = false;
        this.isLoadingBalances = false;
        this.isLoadingTransactions = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
        this.isLoadingBalances = false;
        this.isLoadingTransactions = false;
      }
    });
  }

  calculateBalanceSummary() {
    const userId = this.currentUser!.userId;
    
    let totalOwed = 0;
    let totalOwing = 0;
    
    this.userBalances.forEach(balance => {
      if (balance.amount > 0) {
        // Current user is owed money
        if (balance.user1 === userId) {
          totalOwed += balance.amount;
        } else {
          totalOwing += Math.abs(balance.amount);
        }
      } else if (balance.amount < 0) {
        // Current user owes money
        if (balance.user1 === userId) {
          totalOwing += Math.abs(balance.amount);
        } else {
          totalOwed += balance.amount;
        }
      }
    });
    
    this.balanceSummary = { totalOwed, totalOwing };
  }

  get netBalance(): number {
    if (!this.balanceSummary) return 0;
    return this.balanceSummary.totalOwed - this.balanceSummary.totalOwing;
  }
}