import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  if (authService.isAuthenticated()) {
    const token = authService.getToken();
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      console.log('Added auth header to request:', req.url);
      
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('HTTP Error:', error);
          
          if (error.status === 401 && !req.url.includes('/auth/refresh')) {
            console.log('401 error, attempting token refresh...');
            
            return authService.refreshToken().pipe(
              switchMap(() => {
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
  }
  
  return next(req);
};