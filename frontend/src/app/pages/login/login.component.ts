import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">💳</div>
        <h2>Panel Bancario</h2>
        <p class="subtitle">Gestión de Tarjetas de Crédito</p>
        <div *ngIf="errorMsg" class="alert-error">⚠️ {{ errorMsg }}</div>
        <label>Usuario</label>
        <input type="text" [(ngModel)]="username" placeholder="usuario" (keyup.enter)="login()" />
        <label>Contraseña</label>
        <input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="login()" />
        <button [disabled]="loading" (click)="login()">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1a237e,#1565c0); }
    .login-card { background:white; padding:48px 40px; border-radius:16px; width:360px; box-shadow:0 20px 60px rgba(0,0,0,0.3); display:flex; flex-direction:column; gap:10px; }
    .login-logo { font-size:48px; text-align:center; }
    h2 { margin:0; text-align:center; color:#1a237e; font-size:24px; }
    .subtitle { margin:0; text-align:center; color:#888; font-size:13px; }
    label { font-size:13px; font-weight:600; color:#333; margin-top:6px; }
    input { padding:11px 14px; border:2px solid #e0e0e0; border-radius:8px; font-size:15px; outline:none; width:100%; box-sizing:border-box; }
    input:focus { border-color:#1a237e; }
    button { margin-top:10px; padding:13px; background:#1a237e; color:white; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; }
    button:disabled { opacity:0.6; cursor:not-allowed; }
    .alert-error { background:#ffebee; color:#c62828; padding:10px 14px; border-radius:8px; font-size:13px; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(
    private api: ApiService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId) && localStorage.getItem('token')) {
      this.router.navigate(['/cards']);
    }
  }

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMsg = 'Ingresa usuario y contraseña';
      return;
    }
    if (this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    this.api.login(this.username.trim(), this.password).subscribe({
      next: (res: any) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('token', res.token);
        }
        this.router.navigate(['/cards']);
      },
      error: (err: any) => {
        this.errorMsg = err.error?.message || 'Usuario o contraseña incorrectos';
        this.loading = false;
      }
    });
  }
}