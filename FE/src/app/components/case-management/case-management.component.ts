import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModalComponent } from '../overlay-modal/overlay-modal.component';
import { CaseService } from '../../services/case.service';

@Component({
  selector: 'app-case-management',
  standalone: true,
  imports: [CommonModule, OverlayModalComponent],
  templateUrl: './case-management.component.html',
  styleUrl: './case-management.component.scss'
})
export class CaseManagementComponent implements OnInit {

  selectedCase: any = null;
  showDeleteConfirmation: boolean = false;
  caseToDelete: any = null;
  cases: any[] = [];

  currentYear: number = new Date().getFullYear();

  constructor(private caseService: CaseService) { }

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.caseService.getAllCases().subscribe({
      next: (data) => {
        this.cases = data;
      },
      error: (error) => {
        console.error('Error fetching cases:', error);
      }
    });
  }

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
      this.caseService.deleteCase(this.caseToDelete.id).subscribe({
        next: () => {
          this.cases = this.cases.filter(c => c.id !== this.caseToDelete.id);
          this.caseToDelete = null;
          this.showDeleteConfirmation = false;
        },
        error: (error) => {
          console.error('Error deleting case:', error);
          this.showDeleteConfirmation = false;
        }
      });
    } else {
      this.showDeleteConfirmation = false;
    }
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
