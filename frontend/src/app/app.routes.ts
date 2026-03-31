import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    redirectTo: 'cards',
    pathMatch: 'full'
  },
  {
    path: 'cards',
    loadComponent: () => import('./pages/cards/cards.component').then(m => m.CardsComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'login' }
];