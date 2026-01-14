import { Routes } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';

export const routes: Routes = [
    { path: '', component: LoginFormComponent },
    { path: 'admin', component: AdminPanelComponent },

];
