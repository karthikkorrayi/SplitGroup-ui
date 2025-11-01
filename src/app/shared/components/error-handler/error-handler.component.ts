import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-handler',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="error-card" *ngIf="show">
      <mat-card-content>
        <div class="error-content">
          <mat-icon class="error-icon">{{ icon }}</mat-icon>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          <button mat-raised-button color="primary" (click)="onRetry()" *ngIf="showRetry">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .error-card {
      margin: 1rem 0;
      border-left: 4px solid #f44336;
    }

    .error-content {
      text-align: center;
      padding: 2rem;

      .error-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: #f44336;
        margin-bottom: 1rem;
      }

      h3 {
        color: #333;
        margin: 0 0 1rem 0;
      }

      p {
        color: #666;
        margin: 0 0 2rem 0;
      }

      button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 auto;
      }
    }
  `]
})
export class ErrorHandlerComponent {
  @Input() show = false;
  @Input() title = 'Something went wrong';
  @Input() message = 'Please try again later';
  @Input() icon = 'error';
  @Input() showRetry = true;
  @Input() retryCallback?: () => void;

  onRetry(): void {
    if (this.retryCallback) {
      this.retryCallback();
    }
  }
}