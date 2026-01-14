import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type UserRole = 'EMS' | 'HOSPITAL' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private users: User[] = [
    {
      id: 'admin_default_001',
      username: 'admin1',
      role: 'ADMIN'
    },
    {
      id: 'u1',
      username: 'John Doe',
      role: 'EMS'
    },
    {
      id: 'u2',
      username: 'Anna Smith',
      role: 'HOSPITAL'
    }
  ];

  private usersSubject = new BehaviorSubject<User[]>(this.users);
  public users$ = this.usersSubject.asObservable();

  getAll(): User[] {
    return [...this.users];
  }

  create(user: User) {
    this.users.push(user);
    this.usersSubject.next([...this.users]);
  }

  update(user: User) {
    this.users = this.users.map(u => u.id === user.id ? user : u);
    this.usersSubject.next([...this.users]);
  }

  delete(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    this.usersSubject.next([...this.users]);
  }
}
