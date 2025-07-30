import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, Observable } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
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
            <mat-card-title class="auth-title">Welcome Back</mat-card-title>
            <mat-card-subtitle>Sign in to your SplitGroup account</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
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
                <mat-error *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid">
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
                  placeholder="Enter your password"
                  autocomplete="current-password">
                <button 
                  mat-icon-button 
                  matSuffix 
                  (click)="hidePassword = !hidePassword"
                  [attr.aria-label]="'Hide password'" 
                  [attr.aria-pressed]="hidePassword"
                  type="button">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
                  {{ getErrorMessage('password') }}
                </mat-error>
              </mat-form-field>

              <!-- Remember Me -->
              <div class="form-options">
                <mat-checkbox formControlName="rememberMe">
                  Remember me
                </mat-checkbox>
              </div>

              <!-- Submit Button -->
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                class="full-width auth-submit-btn"
                [disabled]="loginForm.invalid || (isLoading$ | async)">
                <mat-spinner *ngIf="isLoading$ | async" diameter="20" class="inline-spinner"></mat-spinner>
                <span *ngIf="!(isLoading$ | async)">Sign In</span>
                <span *ngIf="isLoading$ | async">Signing In...</span>
              </button>
            </form>
          </mat-card-content>

          <mat-card-actions class="auth-actions">
            <p class="auth-link-text">
              Don't have an account? 
              <a (click)="goToRegister()" class="auth-link">Sign up here</a>
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
      justify-content: space-between;
      align-items: center;
      margin: 0.5rem 0;
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
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  returnUrl: string = '/dashboard';
  isLoading$: Observable<boolean>;
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize observable after authService is available
    this.isLoading$ = this.authService.isLoading$;
    
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    if (!environment.production) {
      this.loginForm.patchValue({
        email: 'test@example.com'
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      this.authService.login({ email, password })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Login successful, navigating to:', this.returnUrl);
            this.router.navigate([this.returnUrl]);
          },
          error: (error) => {
            console.error('Login failed:', error);
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `Password must be at least ${minLength} characters long`;
    }
    
    return '';
  }
}