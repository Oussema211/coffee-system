import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Role-based guard factory.
 *
 * Usage:
 *   canActivate: [authGuard, roleGuard('ADMIN')]
 *   canActivate: [authGuard, roleGuard('WORKER')]
 *
 * If the authenticated user's role does not match the required role,
 * they are redirected to their own dashboard instead of showing an error.
 */
export const roleGuard = (requiredRole: 'ADMIN' | 'WORKER'): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.getRole();

    if (role === requiredRole) {
      return true;
    }

    // Redirect to the user's correct dashboard
    if (role === 'ADMIN') {
      return router.createUrlTree(['/admin']);
    }

    if (role === 'WORKER') {
      return router.createUrlTree(['/worker']);
    }

    // No valid role → back to login
    return router.createUrlTree(['/login']);
  };
};
