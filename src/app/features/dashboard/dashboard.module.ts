import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BalanceSummaryComponent } from './components/balance-summary/balance-summary.component';
import { RecentTransactionsComponent } from './components/recent-transactions/recent-transactions.component';

@NgModule({
  declarations: [
    DashboardComponent,
    BalanceSummaryComponent,
    RecentTransactionsComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    
    // Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ]
})
export class DashboardModule { }