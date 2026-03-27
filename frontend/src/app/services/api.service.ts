import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private headers() {
    const token = this.isBrowser() ? localStorage.getItem('token') : '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  login(username: string, password: string) {
    return this.http.post(`${this.base}/auth/login`, { username, password });
  }

  getCards(): Observable<any> {
    if (!this.isBrowser()) return of([]);
    return this.http.get(`${this.base}/cards`, { headers: this.headers() });
  }

  createCard(data: any): Observable<any> {
    if (!this.isBrowser()) return of(null);
    return this.http.post(`${this.base}/cards`, data, { headers: this.headers() });
  }

  updateCard(id: string, data: any): Observable<any> {
    if (!this.isBrowser()) return of(null);
    return this.http.put(`${this.base}/cards/${id}`, data, { headers: this.headers() });
  }

  deleteCard(id: string): Observable<any> {
    if (!this.isBrowser()) return of(null);
    return this.http.delete(`${this.base}/cards/${id}`, { headers: this.headers() });
  }
}