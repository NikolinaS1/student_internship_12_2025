import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
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
export class AdminPanelComponent {
    activeTab: 'users' | 'cases' = 'users';

    constructor(public auth: AuthService) { }
}