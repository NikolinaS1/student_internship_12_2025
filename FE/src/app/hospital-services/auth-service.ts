import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class AuthService {
  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  getRole(): string {
    // decode JWT
    const payload = JSON.parse(atob(this.getToken().split('.')[1]));
    return payload.role;
  }
}