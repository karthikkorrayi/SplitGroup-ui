import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container" *ngIf="show">
      <mat-spinner [diameter]="size" [color]="color"></mat-spinner>
      <p *ngIf="message" class="loading-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;

      .loading-message {
        color: #666;
        font-size: 1rem;
        margin: 0;
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() show = true;
  @Input() message = '';
  @Input() size = 50;
  @Input() color = 'primary';
}