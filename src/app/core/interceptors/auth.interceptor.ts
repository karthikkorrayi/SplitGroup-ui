import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  console.log('HTTP Request:', req.method, req.url);
  
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    console.log('Auth request, skipping token');
    return next(req);
  }

  if (authService.isAuthenticated()) {
    const token = authService.getToken();
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      console.log('Added auth header to request:', req.method, req.url, 'Token length:', token.length);
      
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('HTTP Error:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
          
          if (error.status === 401 && !req.url.includes('/auth/refresh')) {
            console.log('401 error, attempting token refresh...');
            
            return authService.refreshToken().pipe(
              switchMap(() => {
                console.log('Token refreshed, retrying request');
                const newToken = authService.getToken();
                const retryReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                });
                return next(retryReq);
              }),
              catchError((refreshError) => {
                console.error('Token refresh failed:', refreshError);
                authService.logout();
                return throwError(() => error);
              })
            );
          }
          
          return throwError(() => error);
        })
      );
    }
  } else {
    console.log('User not authenticated, request without token:', req.url);
  }
  
  return next(req);
};