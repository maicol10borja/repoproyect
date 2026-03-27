import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') return true;
  localStorage.removeItem('token');
  router.navigate(['/login']);
  return false;
};