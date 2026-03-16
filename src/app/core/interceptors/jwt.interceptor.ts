import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError(err => {
      const toastService = inject(ToastService);
      if (err.status === 401) {
        authService.logout();
        toastService.error('Sesi telah berakhir. Silakan login kembali.');
      } else if (err.status === 403) {
        toastService.error('Anda tidak memiliki akses ke fitur ini.');
      } else if (err.status === 0) {
        toastService.error('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
      }
      return throwError(() => err);
    })
  );
};
