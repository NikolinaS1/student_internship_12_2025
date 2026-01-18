import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModalComponent } from '../overlay-modal/overlay-modal.component';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [CommonModule, OverlayModalComponent],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.scss'
})
export class CaseManagementComponent {

  selectedCase: any = null;
  showDeleteConfirmation: boolean = false;
  caseToDelete: any = null;


cases = [
    {
      acknowledged: false,
      birthYear: 1990,
      createdAt: "2026-01-12T13:39:10.15504",
      createdById: 1,
      description: "Chest pain and shortness of breath. Patient appears anxious.",
      id: 51,
      isActive: true,
      isSos: true,
      patientName: "Marko Marković",
      priority: "HIGH",
      sex: "M",
      latitude: 45.815399,
      longitude: 15.966568
    },
    {
      acknowledged: true,
      birthYear: 1981,
      createdAt: "2026-01-12T13:39:10.15504",
      createdById: 2,
      description: "Motor vehicle accident. Multiple injuries suspected. Patient semi-conscious.",
      id: 52,
      isActive: true,
      isSos: false,
      patientName: "John Anderson",
      priority: "MEDIUM",
      sex: "M",
      latitude: 45.815399,
      longitude: 15.966568,
      bpm: 82,
      diastolicPressure: 95,
      systolicPressure: 145,
      temperature: 37.2,
      resRate: 18,
      saturation: 96
    },
  ];

  openCase(c: any) {
    this.selectedCase = c;
  }

  closeCase() {
    this.selectedCase = null;
  }

  deleteCase(c: any) {
    this.caseToDelete = c;
    this.showDeleteConfirmation = true;
  }

  confirmDelete() {
    if (this.caseToDelete) {
      this.cases = this.cases.filter(c => c.id !== this.caseToDelete.id);
      this.caseToDelete = null;
    }
    this.showDeleteConfirmation = false;
  }

  cancelDelete() {
    this.caseToDelete = null;
    this.showDeleteConfirmation = false;
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }
}
