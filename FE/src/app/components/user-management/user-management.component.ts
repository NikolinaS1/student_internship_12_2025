import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserRole } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit, OnDestroy {

  /** STATE */
  showCreateModal = false;
  showEditModal = false;

  /** USERS */
  users: User[] = [];

  /** CREATE FORM */
  newUser = {
    username: '',
    password: '',
    role: 'EMS' as UserRole,
  };

  /** EDIT FORM */
  editedUser: User | null = null;

  private subscription: Subscription = new Subscription();

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.subscription.add(
      this.userService.users$.subscribe(users => {
        this.users = users;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

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

    const user: User = {
      id: 'user_' + Date.now(),
      username: this.newUser.username,
      role: this.newUser.role,
    };

    this.userService.create(user);
    this.closeModals();
  }

  saveUserChanges(): void {
    if (!this.editedUser) {
      return;
    }

    this.userService.update(this.editedUser);
    this.closeModals();
  }

  deleteUser(user: User): void {
    this.userService.delete(user.id);
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