import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(c => c.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(c => c.ProfileComponent)
      },
      {
        path: 'users',
        children: [
          {
            path: 'search',
            loadComponent: () => import('./features/users/user-search/user-search.component').then(c => c.UserSearchComponent)
          },
          {
            path: '',
            redirectTo: 'search',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'transactions',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/transactions/transaction-list/transaction-list.component').then(c => c.TransactionListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('./features/transactions/create-transaction/create-transaction.component').then(c => c.CreateTransactionComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/transactions/transaction-detail/transaction-detail.component').then(c => c.TransactionDetailComponent)
          }
        ]
      },
      {
        path: 'balances',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/balances/balance-overview/balance-overview.component').then(c => c.BalanceOverviewComponent)
          },
          {
            path: 'settle',
            loadComponent: () => import('./features/balances/settle-balance/settle-balance.component').then(c => c.SettleBalanceComponent)
          },
          {
            path: 'settlements',
            loadComponent: () => import('./features/balances/settlement-history/settlement-history.component').then(c => c.SettlementHistoryComponent)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];