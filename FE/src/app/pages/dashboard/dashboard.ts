import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CaseModal } from '../../components/case-modal/case-modal';
import { Case } from '../../models/case.model';
import { MOCK_USER } from '../../models/mock-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Header, Sidebar, CaseModal, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {
  currentUser = MOCK_USER;
  activeCase: Case | null = null;
  isModalOpen = false;
  isEditMode = false;

  openCaseModal(): void {
    this.isEditMode = false;
    this.isModalOpen = true;
  }

  updateCase(): void {
    this.isEditMode = true;
    this.isModalOpen = true;
  }

  closeCaseModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
  }

  onCaseCreated(newCase: Case): void {
    this.activeCase = newCase;
    console.log('Case created:', newCase);
  }

  onCaseUpdated(updatedCase: Case): void {
    this.activeCase = updatedCase;
    console.log('Case updated:', updatedCase);
  }

  endCase(): void {
    if (this.activeCase) {
      this.activeCase.status = 'completed';
      this.activeCase = null;
    }
  }

  getHeartRateDisplay(): string {
    if (!this.activeCase) return '';
    return `${this.activeCase.bpm} bpm`;
  }

  getRespiratoryRateDisplay(): string {
    if (!this.activeCase) return '';
    return `${this.activeCase.resRate} br/min`;
  }

  getO2Display(): string {
    if (!this.activeCase) return '';
    return `${this.activeCase.saturation}%`;
  }
}