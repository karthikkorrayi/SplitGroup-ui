import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card-container">
        <mat-card class="auth-card">
          <mat-card-header class="auth-header">
            <mat-card-title class="auth-title">
              <mat-icon class="app-icon">account_balance_wallet</mat-icon>
              Welcome to SplitGroup
            </mat-card-title>
            <mat-card-subtitle>Your Smart Expense Splitting Application</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="auth-content">
            <div class="demo-info">
              <h3>🚀 Demo Mode</h3>
              <p>Experience the full SplitGroup application with sample data</p>
              
              <div class="features-list">
                <div class="feature-item">
                  <mat-icon>check_circle</mat-icon>
                  <span>Track shared expenses</span>
                </div>
                <div class="feature-item">
                  <mat-icon>check_circle</mat-icon>
                  <span>Split bills automatically</span>
                </div>
                <div class="feature-item">
                  <mat-icon>check_circle</mat-icon>
                  <span>Settle balances easily</span>
                </div>
                <div class="feature-item">
                  <mat-icon>check_circle</mat-icon>
                  <span>View detailed reports</span>
                </div>
              </div>
            </div>

            <button 
              mat-raised-button 
              color="primary" 
              class="demo-login-btn"
              (click)="loginAsDemo()"
              [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20" class="inline-spinner"></mat-spinner>
              <mat-icon *ngIf="!loading">login</mat-icon>
              <span *ngIf="!loading">Enter Demo</span>
              <span *ngIf="loading">Loading Demo...</span>
            </button>
          </mat-card-content>

          <mat-card-actions class="auth-actions">
            <p class="demo-note">
              <mat-icon>info</mat-icon>
              This is a demo version with sample data
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
      max-width: 450px;
    }

    .auth-card {
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-title {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .app-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #3f51b5;
    }

    .auth-content {
      text-align: center;
    }

    .demo-info {
      margin-bottom: 2rem;
    }

    .demo-info h3 {
      color: #3f51b5;
      margin: 0 0 1rem 0;
      font-size: 1.3rem;
    }

    .demo-info p {
      color: #666;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 1.5rem 0;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      background: rgba(63, 81, 181, 0.05);
      border-radius: 8px;
      text-align: left;
    }

    .feature-item mat-icon {
      color: #4caf50;
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .feature-item span {
      color: #333;
      font-weight: 500;
    }

    .demo-login-btn {
      width: 100%;
      height: 56px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 12px;
      background: linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%);
      box-shadow: 0 4px 15px rgba(63, 81, 181, 0.3);
      transition: all 0.3s ease;
    }

    .demo-login-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(63, 81, 181, 0.4);
    }

    .inline-spinner {
      margin-right: 8px;
    }

    .auth-actions {
      padding: 1.5rem 0 0 0;
      justify-content: center;
    }

    .demo-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      color: #666;
      font-size: 0.9rem;
      background: rgba(33, 150, 243, 0.1);
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }

    .demo-note mat-icon {
      color: #2196f3;
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    @media (max-width: 768px) {
      .auth-card {
        padding: 2rem;
        margin: 0 1rem;
      }
      
      .auth-title {
        font-size: 1.7rem;
      }
    }
  `]
})
export class LoginComponent {
  loading = false;

  constructor(private router: Router) {}

  loginAsDemo(): void {
    this.loading = true;
    
    // Simulate loading and create demo user
    setTimeout(() => {
      const demoUser = {
        id: 1,
        name: 'Demo User',
        email: 'demo@splitgroup.com'
      };
      
      // Store demo user data
      localStorage.setItem('splitgroup_user', JSON.stringify(demoUser));
      localStorage.setItem('splitgroup_token', 'demo-jwt-token-' + Date.now());
      
      this.loading = false;
      this.router.navigate(['/dashboard']);
    }, 1500);
  }
}