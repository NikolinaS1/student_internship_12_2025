import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Case } from '../../models/case.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  @Input() activeCase: Case | null = null;
  @Output() newCaseClicked = new EventEmitter<void>();

  onNewCaseClick(): void {
    this.newCaseClicked.emit();
  }

  getPriorityClass(): string {
    if (!this.activeCase) return '';
    return `priority-${this.activeCase.priority.toLowerCase()}`;
  }

  getStatusClass(): string {
    if (!this.activeCase) return '';
    return `status-${this.activeCase.status}`;
  }

  getStatusBadgeClass(): string {
    if (!this.activeCase) return '';
    return `status-${this.activeCase.status}`;
  }
}