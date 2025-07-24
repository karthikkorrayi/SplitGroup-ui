import { Component } from '@angular/core';

@Component({
  selector: 'app-welcome',
  template: `
    <div style="padding: 40px; text-align: center;">
      <h1>Welcome to SplitWise!</h1>
      <p>Your application is working correctly.</p>
      <p>Angular routing is functional.</p>
    </div>
  `,
  styles: [`
    div {
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    p {
      color: #666;
      margin-bottom: 10px;
    }
  `]
})
export class WelcomeComponent { }