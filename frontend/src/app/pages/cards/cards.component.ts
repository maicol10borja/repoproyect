import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';


const BASE = 'https://tarjetas-backend.onrender.com/api';

interface Notif {
  type: 'success' | 'info' | 'error';
  title: string;
  sub: string;
  time: string;
}

export const ROLE_INFO: Record<string, { label: string; color: string; icon: string; perms: string[] }> = {
  admin: {
    label: 'Administrador', color: '#6366f1',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    perms: ['Ver tarjetas', 'Crear tarjetas', 'Editar tarjetas', 'Eliminar tarjetas', 'Gestionar usuarios']
  },
  agente: {
    label: 'CRO / Agente', color: '#f59e0b',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/><path d="M12 11v4"/><path d="M10 15h4"/></svg>`,
    perms: ['Ver tarjetas', 'Crear tarjetas', 'Editar tarjetas']
  },
  cumplimiento: {
    label: 'Cumplimiento', color: '#22d3ee',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    perms: ['Ver tarjetas (solo lectura)']
  }
};

const NOTIF_STORE: Record<string, Notif[]> = {
  admin: [],
  agente: [],
  cumplimiento: []
};

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardComponent, ConfirmModalComponent],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  cards: any[] = [];
  private _lastCardsStr = '';
  filtered: any[] = [];
  search = '';
  showForm = false;
  editMode = false;
  selectedId = '';
  cardToDeleteId: string | null = null;
  errorMsg = '';
  fieldError: { [key: string]: string } = {};
  expiryPreview = '';
  logoMode: 'url' | 'file' = 'url';
  saving = false;
  isCollapsed = false;
  isDragging = false;
  minDate = new Date().toISOString().split('T')[0];
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 4)).toISOString().split('T')[0];
  form = { name: '', cedula: '', description: '', logo: '', issueDate: '' };

  urlValidating = false;
  urlValid: boolean | null = null;
  roleInfo = ROLE_INFO;
  showRoleInfo = false;
  showPanel = false;

  toasts: (Notif & { id: number })[] = [];
  private toastId = 0;

  constructor(private router: Router, private cd: ChangeDetectorRef) { }

  get userRole() { return localStorage.getItem('role') || 'cumplimiento'; }
  get userName() { return localStorage.getItem('username') || ''; }
  get canEdit() { return ['admin', 'agente'].includes(this.userRole); }
  get canDelete() { return this.userRole === 'admin'; }
  get currentRoleInfo() { return this.roleInfo[this.userRole] || this.roleInfo['cumplimiento']; }

  notifs: Notif[] = [];
  get unreadCount() { return this.notifs.length; }

  private pollInterval: any;

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (this.showPanel && !t.closest('.bell-wrap')) {
      this.showPanel = false;
      this.cd.detectChanges();
    }
  }

  private token() { return localStorage.getItem('token') || ''; }
  private headers() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token()}` };
  }
  private async request(method: string, url: string, body?: any) {
    const res = await fetch(`${BASE}${url}`, {
      method, headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  }

  addNotif(type: 'success' | 'info' | 'error', title: string, sub: string, roles?: string[]) {
    const time = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    const notif: Notif = { type, title, sub, time };
    const id = ++this.toastId;
    this.toasts.unshift({ ...notif, id });
    this.cd.detectChanges();
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.cd.detectChanges();
    }, 4000);
  }

  clearNotifs() { this.notifs = []; this.cd.detectChanges(); }
  togglePanel(e: MouseEvent) { e.stopPropagation(); this.showPanel = !this.showPanel; }
  toggleRoleInfo() { this.showRoleInfo = !this.showRoleInfo; }

  setLogoMode(mode: 'url' | 'file') {
    this.logoMode = mode;
    this.form.logo = '';
    this.urlValid = null;
    this.cd.detectChanges();
  }

  async validateImageUrl(url: string) {
    if (!url || (!url.startsWith('http') && !url.startsWith('//'))) {
      this.urlValid = false;
      this.cd.detectChanges();
      return;
    }
    this.urlValidating = true;
    this.urlValid = null;
    this.cd.detectChanges();

    const timeoutId = setTimeout(() => {
      this.urlValidating = false;
      this.urlValid = url.length > 10 ? true : false;
      this.cd.detectChanges();
    }, 4000);

    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => {
          const img2 = new Image();
          img2.onload = () => resolve();
          img2.onerror = () => reject();
          img2.src = url + (url.includes('?') ? '&' : '?') + '_nc=' + Date.now();
        };
        img.src = url;
      });
      clearTimeout(timeoutId);
      this.urlValid = true;
    } catch {
      clearTimeout(timeoutId);
      this.urlValid = false;
    } finally {
      this.urlValidating = false;
      this.cd.detectChanges();
    }
  }

  onUrlChange(url: string) {
    this.form.logo = url;
    this.urlValid = null;
    if (url.length > 8) {
      clearTimeout((this as any)._urlTimer);
      (this as any)._urlTimer = setTimeout(() => this.validateImageUrl(url), 700);
    }
  }

  onImgError(event: Event) {
    const el = event.target as HTMLImageElement;
    if (el) el.style.display = 'none';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.readFile(file);
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.readFile(file);
  }

  private readFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      this.fieldError['logo'] = 'La imagen supera 2MB';
      this.cd.detectChanges();
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.form.logo = e.target.result;
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  formatCardNumber(cedula: string, cardId: string): string {
    const base = (cedula + cardId.replace('-', '')).replace(/\D/g, '').padEnd(16, '0').substring(0, 16);
    return base.match(/.{1,4}/g)!.join('    ');
  }

  ngOnInit() {
    if (!this.token()) { this.router.navigate(['/login']); return; }
    this.loadCards();
    this.fetchActivity();
    this.pollInterval = setInterval(() => {
      this.fetchActivity();
      this.loadCards(true); // silent reload
    }, 5000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  async fetchActivity() {
    try {
      const res = await fetch(`${BASE}/activity`, { headers: this.headers() });
      if (res.ok) {
        const data = await res.json();
        this.notifs = data.map((act: any) => {
          let type: 'success' | 'info' | 'error' = 'info';
          if (act.actionType === 'CREATE') type = 'success';
          if (act.actionType === 'DELETE') type = 'error';

          let title = '';
          if (act.actionType === 'LOGIN') title = 'Sesión Iniciada';
          else if (act.actionType === 'CREATE') title = 'Nueva Tarjeta';
          else if (act.actionType === 'UPDATE') title = 'Tarjeta Editada';
          else if (act.actionType === 'DELETE') title = 'Tarjeta Eliminada';
          else title = 'Actividad';

          const time = new Date(act.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
          return { type, title, sub: `${act.username} (${act.role}): ${act.details}`, time };
        });
        this.cd.detectChanges();
      }
    } catch (e) { }
  }

  async loadCards(silent = false) {
    try {
      const res = await this.request('GET', '/cards');
      const newStr = JSON.stringify(res);
      if (silent && this._lastCardsStr === newStr) return; // Evitar parpadeos si no hay cambios
      this._lastCardsStr = newStr;

      this.cards = Array.isArray(res) ? res : [];
      this.filtered = [...this.cards];
      if (this.search.trim()) this.filterCards();
    } catch (e: any) {
      if (e?.message === 'Sin token' || e?.message === 'Token inválido') {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        this.router.navigate(['/login']);
      }
    } finally { this.cd.detectChanges(); }
  }

  filterCards() {
    const q = this.search.toLowerCase();
    this.filtered = this.cards.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.cedula?.includes(q) ||
      c.cardId?.toLowerCase().includes(q)
    );
  }

  onIssueDateChange() {
    if (this.form.issueDate) {
      const d = new Date(this.form.issueDate + 'T12:00:00');
      d.setFullYear(d.getFullYear() + 4);
      this.expiryPreview = d.toLocaleDateString('es-EC');
    } else { this.expiryPreview = ''; }
  }

  clearFieldError(field: string) { delete this.fieldError[field]; }

  openCreate() {
    if (!this.canEdit) return;
    this.form = { name: '', cedula: '', description: '', logo: '', issueDate: '' };
    this.logoMode = 'url'; this.saving = false; this.editMode = false;
    this.selectedId = ''; this.errorMsg = ''; this.fieldError = {};
    this.expiryPreview = ''; this.showForm = true;
    this.urlValid = null; this.isDragging = false;
    this.cd.detectChanges();
  }

  openEdit(card: any) {
    if (!this.canEdit) return;
    const issue = card.issueDate ? new Date(card.issueDate).toISOString().split('T')[0] : '';
    this.form = {
      name: card.name || '',
      cedula: card.cedula || '',
      description: card.description || '',
      logo: card.logo || '',
      issueDate: issue
    };
    this.logoMode = (card.logo && card.logo.startsWith('data:')) ? 'file' : 'url';
    this.saving = false; this.selectedId = card._id;
    this.editMode = true; this.errorMsg = ''; this.fieldError = {};
    this.onIssueDateChange(); this.showForm = true;
    this.urlValid = null; this.isDragging = false;
    this.cd.detectChanges();
  }

  validarCedula(cedula: string): string | null {
    if (!/^\d{10}$/.test(cedula)) return 'Debe tener 10 dígitos';
    const prov = parseInt(cedula.substring(0, 2));
    if (prov < 1 || prov > 24) return 'Provincia inválida';
    const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let v = parseInt(cedula[i]) * coef[i];
      if (v >= 10) v -= 9;
      suma += v;
    }
    const digito = suma % 10 === 0 ? 0 : 10 - (suma % 10);
    if (digito !== parseInt(cedula[9])) return 'Cédula inválida (Registro Civil)';
    return null;
  }

  async save() {
    if (this.saving || !this.canEdit) return;
    this.errorMsg = ''; this.fieldError = {};

    const nombre = this.form.name.trim();
    if (!nombre || nombre.length < 5) { this.fieldError['name'] = 'Mínimo 5 letras'; return; }
    if (nombre.length > 50) { this.fieldError['name'] = 'Máximo 50 caracteres'; return; }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) { this.fieldError['name'] = 'Solo letras'; return; }

    const errCedula = this.validarCedula(this.form.cedula);
    if (errCedula) { this.fieldError['cedula'] = errCedula; return; }

    const desc = this.form.description.trim();
    if (!desc || desc.length < 10) { this.fieldError['description'] = 'Mínimo 10 caracteres'; return; }
    if (desc.length > 100) { this.fieldError['description'] = 'Máximo 100 caracteres'; return; }

    if (!this.form.issueDate) { this.fieldError['issueDate'] = 'La fecha es requerida'; return; }

    if (this.logoMode === 'url' && this.form.logo && this.urlValid === false) {
      this.fieldError['logo'] = 'La URL de imagen no es válida'; return;
    }

    const payload = {
      name: nombre,
      cedula: this.form.cedula,
      description: desc,
      logo: this.form.logo || '',
      issueDate: this.form.issueDate
    };

    this.saving = true; this.cd.detectChanges();
    try {
      let res: any;
      if (this.editMode) {
        res = await this.request('PUT', `/cards/${this.selectedId}`, payload);
        const idx = this.cards.findIndex(c => c._id === this.selectedId);
        if (idx !== -1) this.cards[idx] = res;
        this.addNotif('info', 'Tarjeta actualizada', `${res?.cardId} fue editada`, ['admin', 'agente', 'cumplimiento']);
      } else {
        res = await this.request('POST', '/cards', payload);
        this.cards.unshift(res);
        this.addNotif('success', 'Tarjeta creada', `${res?.cardId} guardada correctamente`, ['admin', 'agente', 'cumplimiento']);
      }
      this.filtered = [...this.cards];
      if (this.search.trim()) this.filterCards();
      this.showForm = false;
      this.saving = false;
    } catch (e: any) {
      this.errorMsg = e?.message || 'Error al guardar';
      this.saving = false;
      this.addNotif('error', 'Error al guardar', e?.message || 'Intenta de nuevo');
    } finally { this.cd.detectChanges(); }
  }

  promptDelete(id: string) {
    if (!this.canDelete) return;
    this.cardToDeleteId = id;
  }

  cancelDelete() {
    this.cardToDeleteId = null;
  }

  async confirmDelete() {
    if (!this.canDelete || !this.cardToDeleteId) return;
    const id = this.cardToDeleteId;
    this.cardToDeleteId = null;

    try {
      await this.request('DELETE', `/cards/${id}`);
      const card = this.cards.find(c => c._id === id);
      this.cards = this.cards.filter(c => c._id !== id);
      this.filtered = this.cards.filter(c => c._id !== id);
      if (this.search.trim()) this.filterCards();
      this.addNotif('error', 'Tarjeta eliminada', `${card?.cardId || ''} fue eliminada`, ['admin', 'agente', 'cumplimiento']);
      this.cd.detectChanges();
    } catch (e: any) {
      this.addNotif('error', 'Error', e?.message || 'Sin permisos para eliminar');
      this.cd.detectChanges();
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    this.router.navigate(['/login']);
  }
}