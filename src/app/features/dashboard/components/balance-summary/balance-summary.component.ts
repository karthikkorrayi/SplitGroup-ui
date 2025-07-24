import { Component, Input } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Balance } from '../../../../core/models/balance.model';

@Component({
  selector: 'app-balance-summary',
  templateUrl: './balance-summary.component.html',
  styleUrls: ['./balance-summary.component.scss']
})
export class BalanceSummaryComponent {
  @Input() balances: Balance[] = [];
  @Input() loading = false;

  constructor(private authService: AuthService) {}

  get displayBalances(): Balance[] {
    // Show only first 3 balances for dashboard
    return this.balances.slice(0, 3);
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
}