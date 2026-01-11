import { Routes } from '@angular/router';
import { HospitalDashboardComponent } from './hospital-dashboard/hospital-dashboard.component';

export const routes: Routes = [
  { path: '', component: HospitalDashboardComponent },
  { path: '**', redirectTo: '' },
];
