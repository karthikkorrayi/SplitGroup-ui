import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card-container">
        <mat-card class="auth-card">
          <mat-card-header class="auth-header">
            <mat-card-title class="auth-title">Join SplitGroup</mat-card-title>
            <mat-card-subtitle>Create your account to start splitting expenses</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
              <!-- Name Field -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input 
                  matInput 
                  type="text" 
                  formControlName="name"
                  placeholder="Enter your full name"
                  autocomplete="name">
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="registerForm.get('name')?.touched && registerForm.get('name')?.invalid">
                  {{ getErrorMessage('name') }}
                </mat-error>
              </mat-form-field>

              <!-- Email Field -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input 
                  matInput 
                  type="email" 
                  formControlName="email"
                  placeholder="Enter your email"
                  autocomplete="email">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid">
                  {{ getErrorMessage('email') }}
                </mat-error>
              </mat-form-field>

              <!-- Password Field -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="password"
                  placeholder="Create a strong password"
                  autocomplete="new-password">
                <button 
                  mat-icon-button 
                  matSuffix 
                  (click)="hidePassword = !hidePassword"
                  [attr.aria-label]="'Hide password'" 
                  [attr.aria-pressed]="hidePassword"
                  type="button">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid">
                  {{ getErrorMessage('password') }}
                </mat-error>
              </mat-form-field>

              <!-- Confirm Password Field -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input 
                  matInput 
                  [type]="hideConfirmPassword ? 'password' : 'text'"
                  formControlName="confirmPassword"
                  placeholder="Confirm your password"
                  autocomplete="new-password">
                <button 
                  mat-icon-button 
                  matSuffix 
                  (click)="hideConfirmPassword = !hideConfirmPassword"
                  [attr.aria-label]="'Hide password'" 
                  [attr.aria-pressed]="hideConfirmPassword"
                  type="button">
                  <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="(registerForm.get('confirmPassword')?.touched && registerForm.get('confirmPassword')?.invalid) || registerForm.hasError('passwordMismatch')">
                  {{ getErrorMessage('confirmPassword') }}
                </mat-error>
              </mat-form-field>

              <!-- Terms and Conditions -->
              <div class="form-options">
                <mat-checkbox formControlName="acceptTerms">
                  I agree to the <a href="#" class="auth-link" target="_blank">Terms and Conditions</a> and <a href="#" class="auth-link" target="_blank">Privacy Policy</a>
                </mat-checkbox>
                <mat-error *ngIf="registerForm.get('acceptTerms')?.touched && registerForm.get('acceptTerms')?.invalid" class="terms-error">
                  You must accept the terms and conditions
                </mat-error>
              </div>

              <!-- Submit Button -->
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                class="full-width auth-submit-btn"
                [disabled]="registerForm.invalid || (isLoading$ | async)">
                <mat-spinner *ngIf="isLoading$ | async" diameter="20" class="inline-spinner"></mat-spinner>
                <span *ngIf="!(isLoading$ | async)">Create Account</span>
                <span *ngIf="isLoading$ | async">Creating Account...</span>
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions class="auth-actions">
            <p class="auth-link-text">
              Already have an account? 
              <a (click)="goToLogin()" class="auth-link">Sign in here</a>
            </p>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-card-container {
      width: 100%;
      max-width: 400px;
    }

    .auth-card {
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-title {
      font-size: 1.8rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .form-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    .form-options mat-checkbox {
      font-size: 0.9rem;
    }

    .terms-error {
      font-size: 0.75rem;
      color: #f44336;
      margin-top: 0.25rem;
    }

    .auth-submit-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .inline-spinner {
      margin-right: 8px;
    }

    .auth-actions {
      padding: 1rem 0 0 0;
      justify-content: center;
    }

    .auth-link-text {
      text-align: center;
      margin: 0;
      color: #666;
    }

    .auth-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }

    .auth-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .auth-card {
        padding: 1.5rem;
        margin: 0 1rem;
      }
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading$: Observable<boolean>;
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize observable after authService is available
    this.isLoading$ = this.authService.isLoading$;
    
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Any initialization logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { name, email, password } = this.registerForm.value;
      
      this.authService.register({ name, email, password })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Registration successful, navigating to dashboard');
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            console.error('Registration failed:', error);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value !== confirmPassword.value ? { 'passwordMismatch': true } : null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${minLength} characters long`;
    }
    
    if (fieldName === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    
    return '';
  }
}