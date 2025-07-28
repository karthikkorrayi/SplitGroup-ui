import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../shared/models/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Input() isHandset: boolean | null = false;
  @Output() sidenavToggle = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

   onMenuClick(): void {
    this.sidenavToggle.emit();
  }

  onProfileClick(): void {
    this.router.navigate(['/profile']);
  }

  onSettingsClick(): void {
    this.router.navigate(['/settings']);
  }

  onLogout(): void {
    this.authService.logout();
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