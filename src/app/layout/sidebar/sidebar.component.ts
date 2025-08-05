import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() currentUser: User | null = null;
  @Input() isHandset: boolean | null = false;
  @Output() sidenavClose = new EventEmitter<void>();

  activeRoute = '';

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Transactions',
      icon: 'receipt_long',
      route: '/transactions'
    },
    {
      label: 'Balances',
      icon: 'account_balance',
      route: '/balances',
      badge: 3
    },
    {
      label: 'Groups',
      icon: 'group',
      route: '/groups'
    },
    {
      label: 'Reports',
      icon: 'analytics',
      route: '/reports'
    }
  ];

  constructor(private router: Router) {
    // Listen to route changes to update active route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.url;
      });
    
    // Set initial active route
    this.activeRoute = this.router.url;
  }

  onNavItemClick(item: NavItem): void {
    this.router.navigate([item.route]);

    // Close sidebar on mobile after navigation
    if (this.isHandset) {
      this.sidenavClose.emit();
    }
  }

  isRouteActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    
    const names = this.currentUser.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }
}