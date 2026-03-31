import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isCollapsed = false;
  showLogoutConfirm = false;
  username: string = 'Usuario';
  role: string = 'Cliente';
  userInitial: string = 'U';

  constructor(private router: Router) {}

  ngOnInit() {
    const storedName = localStorage.getItem('username');
    if (storedName) {
      this.username = storedName;
      this.userInitial = storedName.charAt(0).toUpperCase();
    }
    
    const storedRole = localStorage.getItem('role');
    if (storedRole) {
      if (storedRole === 'admin') this.role = 'Administrador';
      else if (storedRole === 'agente') this.role = 'Agente';
      else this.role = 'Cliente';
    }
  }

  promptLogout() {
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  logout() {
    this.showLogoutConfirm = false;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }
}