/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
export type UserRole = 'EMS' | 'HOSPITAL' | 'ADMIN';

export interface User {
    id: string;
    role: UserRole;
    username: string;

}

@Injectable({ providedIn: 'root' })
export class UserService {

    private usersSubject = new BehaviorSubject<User[]>([]);

    constructor(private http: HttpClient) {
        this.loadUsers();
    }

    private loadUsers() {
        this.http.get<User[]>('https://noncommiserative-marcela-suably.ngrok-free.dev/admin/users').subscribe({
            next: users => {
                console.log('Fetched users:', users);
                this.usersSubject.next(users);
            },
            error: error => {
                console.error('Error fetching users:', error);
            }
        });
    }

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
} */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';

export type UserRole = 'VEHICLE' | 'HOSPITAL' | 'ADMIN';

export interface User {
    id: string;
    role: UserRole;
    username: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

    private usersSubject = new BehaviorSubject<User[]>([]);

    private readonly apiUrl =
        'https://noncommiserative-marcela-suably.ngrok-free.dev/admin/users';

    private readonly ngrokHeaders = new HttpHeaders({
        'ngrok-skip-browser-warning': 'true'
    });

    constructor(private http: HttpClient) {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.http.get<User[]>(this.apiUrl, { headers: this.ngrokHeaders }).subscribe({
            next: users => {
                console.log('Fetched users:', users);
                this.usersSubject.next(users);
            },
            error: error => {
                console.error('Error fetching users:', error);
            }
        });
    }

    get users$(): Observable<User[]> {
        return this.usersSubject.asObservable();
    }

    getAll(): User[] {
        return this.usersSubject.value;
    }

    create(userData: { username: string; password: string; role: UserRole }): void {
        const hashedPassword = CryptoJS.SHA256(userData.password).toString();
        this.http.post<User>(this.apiUrl, { ...userData, password: hashedPassword }, { headers: this.ngrokHeaders }).subscribe({
            next: newUser => {
                const users = [...this.usersSubject.value, newUser];
                this.usersSubject.next(users);
            },
            error: error => {
                console.error('Error creating user:', error);
            }
        });
    }

    update(user: User, password?: string): void {
        const updateData: any = { username: user.username, role: user.role };
        if (password) {
            updateData.password = CryptoJS.SHA256(password).toString();
        }
        this.http.put<User>(`${this.apiUrl}/${user.id}`, updateData, { headers: this.ngrokHeaders }).subscribe({
            next: updatedUser => {
                const users = this.usersSubject.value.map(u =>
                    u.id === user.id ? updatedUser : u
                );
                this.usersSubject.next(users);
            },
            error: error => {
                console.error('Error updating user:', error);
            }
        });
    }

    delete(id: string): void {
        this.http.delete(`${this.apiUrl}/${id}`, { headers: this.ngrokHeaders }).subscribe({
            next: () => {
                const users = this.usersSubject.value.filter(u => u.id !== id);
                this.usersSubject.next(users);
            },
            error: error => {
                console.error('Error deleting user:', error);
            }
        });
    }
}

