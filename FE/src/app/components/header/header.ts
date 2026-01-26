import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Input() currentUser: any;
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}