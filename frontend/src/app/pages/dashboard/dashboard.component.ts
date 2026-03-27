import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  styleUrls: ['./dashboard.component.css'],
  template: `
    <div class="layout" [class.collapsed]="isCollapsed">
      <div class="sidebar">
        <div class="sidebar-header">
          <span class="brand" *ngIf="!isCollapsed">🏦 Panel Bancario</span>
          <button class="toggle-btn" (click)="isCollapsed = !isCollapsed">
            {{ isCollapsed ? '▶' : '◀' }}
          </button>
        </div>
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
          <span class="icon">🏠</span>
          <span class="label" *ngIf="!isCollapsed">Inicio</span>
        </a>
        <a routerLink="/cards" routerLinkActive="active">
          <span class="icon">💳</span>
          <span class="label" *ngIf="!isCollapsed">Tarjetas</span>
        </a>
        <button class="btn-logout" (click)="logout()">
          <span class="icon">🚪</span>
          <span class="label" *ngIf="!isCollapsed">Cerrar sesión</span>
        </button>
      </div>
      <div class="content">
        <h1>Bienvenido al sistema</h1>
        <p>Gestiona las tarjetas de crédito desde el menú lateral.</p>
        <a routerLink="/cards" class="btn-go">Ver Tarjetas →</a>
      </div>
    </div>
  `
})
export class DashboardComponent {
  isCollapsed = false;
  constructor(private router: Router) {}
  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}