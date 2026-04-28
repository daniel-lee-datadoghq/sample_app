import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/');

      if ((error.status === 401 || error.status === 403) && !isAuthEndpoint) {
        authService.logout();
        return throwError(() => error);
      }

      // Skip snackbar for auth endpoints — login/register components handle their own errors inline
      if (!isAuthEndpoint) {
        let message = 'An unexpected error occurred';
        if (error.status === 0) {
          message = 'Unable to connect to server';
        } else if (error.error?.error) {
          message = error.error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        }
        snackBar.open(message, 'Close', { duration: 5000 });
      }

      return throwError(() => error);
    })
  );
};
