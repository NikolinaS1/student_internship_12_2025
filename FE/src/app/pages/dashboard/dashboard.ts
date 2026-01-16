import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Header, Sidebar, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {
  activeCase: any = null; 

  // Test podaci za aktivni slučaj
  simulateActiveCase() {
    this.activeCase = {
      patientName: 'SOS - CPR_CHOKING',
      isSOS: true,
      symptoms: 'Cardiac arrest or choking',
      status: 'Sent'
    };
  }
}