import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>dashboard</mat-icon>
            SplitGroup Dashboard
          </mat-card-title>
          <div class="spacer"></div>
          <button mat-button (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-card-header>
      </mat-card>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon positive">trending_up</mat-icon>
              <div class="stat-info">
                <h3>₹0.00</h3>
                <p>Total Owed to You</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon negative">trending_down</mat-icon>
              <div class="stat-info">
                <h3>₹0.00</h3>
                <p>Total You Owe</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon neutral">account_balance</mat-icon>
              <div class="stat-info">
                <h3>₹0.00</h3>
                <p>Net Balance</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <mat-card class="actions-card">
        <mat-card-header>
          <mat-card-title>Quick Actions</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-grid">
            <button mat-raised-button color="primary">
              <mat-icon>add_circle</mat-icon>
              Add Expense
            </button>
            <button mat-stroked-button color="accent">
              <mat-icon>account_balance</mat-icon>
              View Balances
            </button>
            <button mat-stroked-button>
              <mat-icon>receipt_long</mat-icon>
              Transactions
            </button>
            <button mat-stroked-button>
              <mat-icon>analytics</mat-icon>
              Reports
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Welcome Message -->
      <mat-card class="welcome-card">
        <mat-card-content>
          <h2>🎉 Welcome to SplitGroup!</h2>
          <p>Your expense splitting application is ready to use. Start by adding your first expense or exploring the features above.</p>
          <ul>
            <li>✅ Authentication system ready</li>
            <li>✅ Material Design UI implemented</li>
            <li>✅ Responsive layout working</li>
            <li>✅ Ready for backend integration</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-card mat-card-header {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .header-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .spacer {
      flex: 1;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat-card {
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .stat-icon.positive { color: #4caf50; }
    .stat-icon.negative { color: #f44336; }
    .stat-icon.neutral { color: #2196f3; }

    .stat-info h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .stat-info p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .actions-grid button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
    }

    .welcome-card {
      margin-top: 1rem;
    }

    .welcome-card h2 {
      color: #3f51b5;
      margin-top: 0;
    }

    .welcome-card ul {
      margin: 1rem 0;
    }

    .welcome-card li {
      margin: 0.5rem 0;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 0.5rem;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  constructor(private router: Router) {}

  logout() {
    this.router.navigate(['/auth/login']);
  }
}