import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { UserManagementComponent } from '../user-management/user-management.component';
import { CaseManagementComponent } from '../case-management/case-management.component';

@Component({
    selector: 'app-admin-panel',
    standalone: true,
    imports: [
        CommonModule,
        UserManagementComponent,
        CaseManagementComponent
    ],
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
    activeTab: 'users' | 'cases' = 'users';

    users: any[] = [];
    totalCases = 0; // Placeholder, since case management is not implemented

    constructor(public auth: AuthService, private userService: UserService) { }

    ngOnInit(): void {
        this.userService.users$.subscribe(users => {
            this.users = users;
        });
    }

    get adminUsersCount(): number {
        return this.users.filter(u => u.role === 'ADMIN').length;
    }

    get emsUsersCount(): number {
        return this.users.filter(u => u.role === 'EMS').length;
    }

    get hospitalUsersCount(): number {
        return this.users.filter(u => u.role === 'HOSPITAL').length;
    }
}