import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService) { }

  submit() {
    const ok = this.authService.login(this.username, this.password);
    if (!ok) {
      this.error = 'Invalid username or password';
    }
  }
}

