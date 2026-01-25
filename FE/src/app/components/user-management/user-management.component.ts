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
  showDeleteModal = false;
  userToDelete: User | null = null;

  /** USERS */
  users: User[] = [];
  filteredUsers: User[] = [];

  /** FILTERS */
  searchTerm: string = '';
  selectedRole: UserRole | 'ALL' = 'ALL';

  /** CREATE FORM */
  newUser = {
    username: '',
    password: '',
    role: 'VEHICLE' as UserRole,
  };

  /** EDIT FORM */
  editedUser: User | null = null;
  editedPassword: string = '';

  /** VALIDATION */
  usernameError: string = '';
  editUsernameError: string = '';
  passwordError: string = '';
  editPasswordError: string = '';
  showPassword: boolean = false;
  showEditPassword: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.subscription.add(
      this.userService.users$.subscribe(users => {
        this.users = users;
        this.applyFilters();
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
    this.usernameError = '';
    this.passwordError = '';
    this.showPassword = false;
    this.showCreateModal = true;
  }

  openEditUser(user: User): void {
    this.editedUser = { ...user };
    this.editedPassword = '';
    this.editUsernameError = '';
    this.editPasswordError = '';
    this.showEditPassword = false;
    this.showEditModal = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.editedUser = null;
    this.userToDelete = null;
  }

  /* -------------------------
     CRUD
  -------------------------- */

  createUser(): void {
    this.usernameError = this.validateUsername(this.newUser.username);
    if (this.usernameError) {
      return;
    }

    // Check for duplicate username
    if (this.isUsernameTaken(this.newUser.username)) {
      this.usernameError = 'There is already a user with this username';
      return;
    }

    if (!this.newUser.password) {
      this.passwordError = 'Password is required';
      return;
    }

    this.passwordError = this.validatePassword(this.newUser.password);
    if (this.passwordError) {
      return;
    }

    this.userService.create(this.newUser);
    this.closeModals();
  }

  saveUserChanges(): void {
    if (!this.editedUser) {
      return;
    }

    this.editUsernameError = this.validateUsername(this.editedUser.username);
    if (this.editUsernameError) {
      return;
    }

    // Check for duplicate username (excluding the current user)
    if (this.isUsernameTaken(this.editedUser.username, this.editedUser.id)) {
      this.editUsernameError = 'There is already a user with this username';
      return;
    }

    if (this.editedPassword) {
      this.editPasswordError = this.validatePassword(this.editedPassword);
      if (this.editPasswordError) {
        return;
      }
    }

    this.userService.update(this.editedUser, this.editedPassword || undefined);
    this.closeModals();
  }

  /*confirmDeleteUser(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  deleteUser(): void {
    if (this.userToDelete) {
      this.userService.delete(this.userToDelete.id);
      this.closeModals();
    }
  }
*/
  /* -------------------------
     VALIDATION
  -------------------------- */

  validateUsername(username: string): string {
    if (!username || username.trim() === '') {
      return 'Username is required';
    }
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }
    return '';
  }

  validatePassword(password: string): string {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one capital letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return '';
  }

  isUsernameTaken(username: string, excludeUserId?: number): boolean {
    return this.users.some(user => 
      user.username.toLowerCase() === username.toLowerCase() && 
      user.id !== excludeUserId
    );
  }

  /* -------------------------
     FILTERS
  -------------------------- */

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.selectedRole === 'ALL' || user.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  /* -------------------------
     HELPERS
  -------------------------- */

  private resetCreateForm(): void {
    this.newUser = {
      username: '',
      password: '',
      role: 'VEHICLE',
    };
  }
}