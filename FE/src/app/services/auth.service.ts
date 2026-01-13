import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ADMIN_USERNAME = 'admin';
  private readonly ADMIN_PASS = 'admin123';

  constructor(private router: Router) { }

  login(username: string, password: string): boolean {
    if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASS) {
      localStorage.setItem('loggedIn', 'true');
      this.router.navigate(['/admin']);
      return true;
    }
    return false;
  }

  logout() {
    localStorage.removeItem('loggedIn');
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  }
}
