import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type UserRole = 'EMS' | 'HOSPITAL' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent {

  /** STATE */
  showCreateModal = false;
  showEditModal = false;

  /** USERS */
  users: User[] = [
    {
      id: 'admin_default_001',
      username: 'System Administrator',
      role: 'ADMIN',
    },
  ];

  /** CREATE FORM */
  newUser = {
    username: '',
    password: '',
    role: 'EMS' as UserRole,
  };

  /** EDIT FORM */
  editedUser: User | null = null;

  /* -------------------------
     MODAL CONTROLS
  -------------------------- */

  openCreateUser(): void {
    this.resetCreateForm();
    this.showCreateModal = true;
  }

  openEditUser(user: User): void {
    this.editedUser = { ...user };
    this.showEditModal = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.editedUser = null;
  }

  /* -------------------------
     CRUD
  -------------------------- */

  createUser(): void {
    if (!this.newUser.username || !this.newUser.password) {
      return;
    }

    this.users.push({
      id: 'user_' + Date.now(),
      username: this.newUser.username,
      role: this.newUser.role,
    });

    this.closeModals();
  }

  saveUserChanges(): void {
    if (!this.editedUser) {
      return;
    }

    this.users = this.users.map(u =>
      u.id === this.editedUser!.id ? this.editedUser! : u
    );

    this.closeModals();
  }

  deleteUser(index: number): void {
    this.users.splice(index, 1);
  }

  /* -------------------------
     VALIDATION
  -------------------------- */

  /* -------------------------
     HELPERS
  -------------------------- */

  private resetCreateForm(): void {
    this.newUser = {
      username: '',
      password: '',
      role: 'EMS',
    };
  }
}