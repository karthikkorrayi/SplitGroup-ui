import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { TransactionService } from '../../../../core/services/transaction.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

interface Category {
  name: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-transaction-create',
  templateUrl: './transaction-create.component.html',
  styleUrls: ['./transaction-create.component.scss']
})
export class TransactionCreateComponent implements OnInit {
  transactionForm!: FormGroup;
  isLoading = false;
  filteredUsers: User[] = [];
  selectedUser: User | null = null;

  categories: Category[] = [
    { name: 'Food & Dining', value: 'Food', icon: 'restaurant' },
    { name: 'Transportation', value: 'Transport', icon: 'directions_car' },
    { name: 'Entertainment', value: 'Entertainment', icon: 'movie' },
    { name: 'Shopping', value: 'Shopping', icon: 'shopping_cart' },
    { name: 'Bills & Utilities', value: 'Bills', icon: 'receipt' },
    { name: 'Travel', value: 'Travel', icon: 'flight' },
    { name: 'Health & Fitness', value: 'Health', icon: 'local_hospital' },
    { name: 'Education', value: 'Education', icon: 'school' },
    { name: 'Other', value: 'Other', icon: 'category' }
  ];

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupUserSearch();
  }

  initializeForm() {
    this.transactionForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required]],
      category: ['', [Validators.required]],
      owedByEmail: ['', [Validators.required]],
      splitType: ['EQUAL', [Validators.required]]
    });
  }

  setupUserSearch() {
    this.transactionForm.get('owedByEmail')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(value => {
          if (typeof value === 'string' && value.length >= 2) {
            return this.userService.searchUsersByEmail(value);
          }
          return of([]);
        })
      )
      .subscribe(users => {
        this.filteredUsers = users;
      });
  }

  onSearchUsers(event: any) {
    const value = event.target.value;
    if (typeof value === 'string' && value.length >= 2) {
      this.userService.searchUsersByEmail(value).subscribe(users => {
        this.filteredUsers = users;
      });
    }
  }

  onUserSelected(user: User) {
    this.selectedUser = user;
    this.transactionForm.patchValue({
      owedByEmail: user.email
    });
  }

  displayUser(user: User): string {
    return user ? user.email : '';
  }

  clearSelectedUser() {
    this.selectedUser = null;
    this.transactionForm.patchValue({
      owedByEmail: ''
    });
  }

  onSubmit() {
    if (this.transactionForm.valid && this.selectedUser) {
      this.isLoading = true;
      
      const formData = this.transactionForm.value;
      const transactionData = {
        amount: formData.amount,
        description: formData.description,
        category: formData.category,
        owedBy: this.selectedUser.userId,
        splitType: formData.splitType
      };

      this.transactionService.createTransaction(transactionData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Transaction created successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/transactions']);
        },
        error: (error) => {
          this.isLoading = false;
          // Error handling done by interceptor
        }
      });
    }
  }
}