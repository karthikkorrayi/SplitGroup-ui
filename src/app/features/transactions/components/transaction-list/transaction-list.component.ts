import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { TransactionService } from '../../../../core/services/transaction.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Transaction } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  transactions: Transaction[] = [];
  dataSource = new MatTableDataSource<Transaction>();
  displayedColumns: string[] = ['date', 'description', 'participants', 'amount', 'status', 'actions'];
  isLoading = true;

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadTransactions() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.transactionService.getUserTransactions(currentUser.userId).subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.dataSource.data = transactions;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.isLoading = false;
        }
      });
    }
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