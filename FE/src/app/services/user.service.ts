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

    private usersSubject = new BehaviorSubject<User[]>([
        {
            id: 'ksldsjx',
            username: 'admin1',
            role: 'ADMIN'
        },
        {
            id: 'u2',
            username: 'Anna Smith',
            role: 'HOSPITAL'
        },
        {
            id: 'u3',
            username: 'John Doe',
            role: 'EMS'
        }
    ]);

    get users$(): Observable<User[]> {
        return this.usersSubject.asObservable();
    }

    getAll(): User[] {
        return this.usersSubject.value;
    }

    create(user: User) {
        const users = [...this.usersSubject.value, user];
        this.usersSubject.next(users);
    }

    update(user: User) {
        const users = this.usersSubject.value.map(u => u.id === user.id ? user : u);
        this.usersSubject.next(users);
    }

    delete(id: string) {
        const users = this.usersSubject.value.filter(u => u.id !== id);
        this.usersSubject.next(users);
    }
}
