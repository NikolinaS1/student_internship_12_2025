import { Routes } from '@angular/router';
import { HospitalDashboardComponent } from './pages/hospital-dashboard/hospital-dashboard.component';

export const routes: Routes = [
  { path: '', component: HospitalDashboardComponent },
  { path: '**', redirectTo: '' },
];
