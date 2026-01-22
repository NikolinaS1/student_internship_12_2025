import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class HospitalAuthService {
  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  getRole(): string {
    // decode JWT
    const payload = JSON.parse(atob(this.getToken().split('.')[1]));
    return payload.role;
  }

  getUserId(): number {
    const token = this.getToken();
    if (!token) return 1; // fallback

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || 1;
    } catch {
      return 1;
    }
  }
}