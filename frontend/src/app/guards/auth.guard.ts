//verifica que haya token

import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

// Guard que protege rutas (solo deja pasar si hay token)
export const authGuard: CanActivateFn = () => {

  // Inyecta el router para poder redirigir
  const router = inject(Router);

  // Detecta si estamos en navegador o servidor (SSR)
  const platformId = inject(PLATFORM_ID);

  // Si NO estamos en navegador, permite acceso (evita error con localStorage)
  if (!isPlatformBrowser(platformId)) return true;

  // Obtiene el token guardado en el navegador
  const token = localStorage.getItem('token');

  // Verifica que el token exista y no sea un valor inválido
  if (token && token !== 'undefined' && token !== 'null') {
    return true; // Permite entrar a la ruta
  }

  // Si no hay token válido:
  localStorage.removeItem('token'); // Limpia token inválido
  router.navigate(['/login']); // Redirige al login

  return false; // Bloquea el acceso
};