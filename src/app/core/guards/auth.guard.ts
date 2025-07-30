import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  console.log('Auth guard checking authentication...');

  if (authService.isAuthenticated()) {
    console.log('User is authenticated, allowing access');
    return true;
  } else {
    console.log('User not authenticated, redirecting to login');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
};