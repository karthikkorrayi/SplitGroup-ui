import { Component, Input } from '@angular/core';
import { Transaction } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-recent-transactions',
  templateUrl: './recent-transactions.component.html',
  styleUrls: ['./recent-transactions.component.scss']
})
export class RecentTransactionsComponent {
  @Input() transactions: Transaction[] = [];
  @Input() loading = false;

  constructor() {}

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'Food': 'restaurant',
      'Transport': 'directions_car',
      'Entertainment': 'movie',
      'Shopping': 'shopping_cart',
      'Bills': 'receipt',
      'Travel': 'flight',
      'Health': 'local_hospital',
      'Education': 'school',
      'Other': 'category'
    };
    
    return iconMap[category] || 'category';
  }

  getCategoryIconClass(category: string): string {
    const classMap: { [key: string]: string } = {
      'Food': 'food-icon',
      'Transport': 'transport-icon',
      'Entertainment': 'entertainment-icon',
      'Shopping': 'shopping-icon',
      'Bills': 'bills-icon',
      'Travel': 'travel-icon',
      'Health': 'health-icon',
      'Education': 'education-icon',
      'Other': 'other-icon'
    };
    
    return classMap[category] || 'other-icon';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'active-chip' : 'settled-chip';
  }
}