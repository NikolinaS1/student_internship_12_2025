import { Routes } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { EmsPanelComponent } from './components/ems-panel/ems-panel.component';
import { HospitalPanelComponent } from './components/hospital-panel/hospital-panel.component';
import { ErrorPageComponent } from './components/error-page/error-page.component';

export const routes: Routes = [
    { path: '', component: LoginFormComponent },
    { path: 'admin', component: AdminPanelComponent },
    { path: 'ems', component: EmsPanelComponent },
    { path: 'hospital', component: HospitalPanelComponent },
    { path: 'error', component: ErrorPageComponent },
    { path: '**', redirectTo: '/error' },
];
