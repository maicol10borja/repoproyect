import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

const BASE = 'http://localhost:3000/api';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  cards: any[] = [];
  filtered: any[] = [];
  search = '';
  showForm = false;
  editMode = false;
  selectedId = '';
  successMsg = '';
  errorMsg = '';
  expiryPreview = '';
  logoMode: 'url' | 'file' = 'url';
  saving = false;
  isCollapsed = false;

  form = { name: '', cedula: '', description: '', logo: '', issueDate: '' };

  constructor(private router: Router, private cd: ChangeDetectorRef) {}

  private token() { return localStorage.getItem('token') || ''; }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token()}`
    };
  }

  private async request(method: string, url: string, body?: any) {
    const res = await fetch(`${BASE}${url}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  }

  ngOnInit() {
    if (!this.token()) { this.router.navigate(['/login']); return; }
    this.loadCards();
  }

  async loadCards() {
    try {
      const res = await this.request('GET', '/cards');
      this.cards = Array.isArray(res) ? res : [];
      this.filtered = [...this.cards];
      if (this.search.trim()) this.filterCards();
    } catch(e: any) {
      if (e?.message === 'Sin token' || e?.message === 'Token inválido') {
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
      }
    } finally {
      this.cd.detectChanges();
    }
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

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.form.logo = e.target.result; };
    reader.readAsDataURL(file);
  }

  openCreate() {
    this.form = { name: '', cedula: '', description: '', logo: '', issueDate: '' };
    this.logoMode = 'url';
    this.saving = false;
    this.editMode = false;
    this.selectedId = '';
    this.errorMsg = '';
    this.expiryPreview = '';
    this.showForm = true;
  }

  openEdit(card: any) {
    const issue = card.issueDate ? new Date(card.issueDate).toISOString().split('T')[0] : '';
    this.form = {
      name: card.name || '',
      cedula: card.cedula || '',
      description: card.description || '',
      logo: card.logo || '',
      issueDate: issue
    };
    this.logoMode = 'url';
    this.saving = false;
    this.selectedId = card._id;
    this.editMode = true;
    this.errorMsg = '';
    this.onIssueDateChange();
    this.showForm = true;
  }

  validarCedula(cedula: string): string | null {
    if (!/^\d{10}$/.test(cedula)) return 'Cédula: debe tener 10 dígitos';
    const prov = parseInt(cedula.substring(0, 2));
    if (prov < 1 || prov > 24) return 'Cédula: provincia inválida';
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
    if (this.saving) return;
    this.errorMsg = '';

    const nombre = this.form.name.trim();
    if (!nombre || nombre.length < 5) { this.errorMsg = 'Nombre: mínimo 5 letras'; return; }
    if (nombre.length > 50) { this.errorMsg = 'Nombre: máximo 50 caracteres'; return; }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) { this.errorMsg = 'Nombre: solo letras'; return; }

    const errCedula = this.validarCedula(this.form.cedula);
    if (errCedula) { this.errorMsg = errCedula; return; }

    const desc = this.form.description.trim();
    if (!desc || desc.length < 10) { this.errorMsg = 'Descripción: mínimo 10 caracteres'; return; }
    if (desc.length > 100) { this.errorMsg = 'Descripción: máximo 100 caracteres'; return; }
    if (!this.form.issueDate) { this.errorMsg = 'La fecha de liberación es requerida'; return; }

    const payload = {
      name:        nombre,
      cedula:      this.form.cedula,
      description: desc,
      logo:        this.form.logo || '',
      issueDate:   this.form.issueDate
    };

    this.saving = true;
    this.cd.detectChanges();

    try {
      let res: any;
      if (this.editMode) {
        res = await this.request('PUT', `/cards/${this.selectedId}`, payload);
        const idx = this.cards.findIndex(c => c._id === this.selectedId);
        if (idx !== -1) this.cards[idx] = res;
      } else {
        res = await this.request('POST', '/cards', payload);
        this.cards.unshift(res);
      }
      this.filtered = [...this.cards];
      this.showForm = false;
      this.saving = false;
      this.successMsg = this.editMode
        ? '✅ Actualizada correctamente'
        : `✅ Creada: ${res?.cardId || ''}`;
      setTimeout(() => { this.successMsg = ''; this.cd.detectChanges(); }, 4000);
    } catch(e: any) {
      this.errorMsg = e?.message || 'Error al guardar';
      this.saving = false;
    } finally {
      this.cd.detectChanges();
    }
  }

  async delete(id: string) {
    if (!confirm('¿Eliminar esta tarjeta?')) return;
    try {
      await this.request('DELETE', `/cards/${id}`);
      this.cards = this.cards.filter(c => c._id !== id);
      this.filtered = [...this.cards];
      this.successMsg = '🗑️ Eliminada';
      this.cd.detectChanges();
      setTimeout(() => { this.successMsg = ''; this.cd.detectChanges(); }, 3000);
    } catch(e) {}
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}