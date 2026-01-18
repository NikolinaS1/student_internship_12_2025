import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'https://unpoliced-ray-cisted.ngrok-free.dev/';

  constructor(private router: Router, private http: HttpClient) { }

  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (err) {
      return null;
    }
  }

  private getRedirectPath(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '/admin';
      case 'vehicle':
        return '/ems';
      case 'hospital':
        return '/hospital';
      default:
        return '/admin';
    }
  }

  async login(name: string, password: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}user/login`;
      const body = { name, password };
      const resp: any = await firstValueFrom(
        this.http.post(url, body, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) })
      );
      const token = resp?.token || resp?.accessToken || null;
      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('loggedIn', 'true');
        
        // Decode JWT and get role
        const decoded = this.decodeJWT(token);
        const role = decoded?.role || decoded?.roles?.[0] || 'admin';
        
        // Redirect based on role
        const redirectPath = this.getRedirectPath(role);
        this.router.navigate([redirectPath]);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const url = `${this.baseUrl}user/logout`;
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      try {
        await firstValueFrom(this.http.post(url, {}, { headers }));
      } catch (err) {
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('loggedIn');
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('auth_token') != null || localStorage.getItem('loggedIn') === 'true';
  }
}
