import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
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
          localStorage.setItem('role', res.role);
          localStorage.setItem('username', res.username);
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