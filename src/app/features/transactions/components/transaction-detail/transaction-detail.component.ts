import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../../../core/services/transaction.service';
import { Transaction } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.scss']
})
export class TransactionDetailComponent implements OnInit {
  transaction: Transaction | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransactionDetail(+id);
    }
  }

  loadTransactionDetail(id: number) {
    this.transactionService.getTransactionDetails(id).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transaction details:', error);
        this.isLoading = false;
      }
    });
  }

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

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'active-chip' : 'settled-chip';
  }
}