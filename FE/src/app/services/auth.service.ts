import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private  baseUrl = '';

  constructor(
  private http: HttpClient,
  private router: Router,
  private configService: ConfigService
) {
  this.configService.getConfig().subscribe(config => {
    this.baseUrl = config.Urls.apiUrl;
  });
}


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
        return '/error';
    }
  }

  async login(name: string, password: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/user/login`;
      const body = { name, password };
      const resp: any = await firstValueFrom(
        this.http.post(url, body, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) })
      );
      const token = resp?.token || resp?.accessToken || null;
      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('loggedIn', 'true');
        
        
        const decoded = this.decodeJWT(token);
        const role = decoded?.group || decoded?.groups?.[0] || 'hospital';
        
        
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
      const url = `${this.baseUrl}/user/logout`;
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      try {
        await firstValueFrom(this.http.post(url, {}, { headers }));
      } catch (err) {
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('loggedIn');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('auth_token') != null || localStorage.getItem('loggedIn') === 'true';
  }

  getUserRole(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }
    const decoded = this.decodeJWT(token);
    return decoded?.group || decoded?.groups?.[0] || null;
  }
}
