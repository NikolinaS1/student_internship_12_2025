import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Header } from '../../components/header/header';
import { Sidebar } from '../../components/sidebar/sidebar';
import { CaseModal } from '../../components/case-modal/case-modal';
import { Case } from '../../models/case.model';
import { MOCK_USER } from '../../models/mock-data';
import { WebSocketService, WebSocketMessage } from '../../services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Header, Sidebar, CaseModal, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  currentUser = MOCK_USER;
  activeCase: Case | null = null;
  isModalOpen = false;
  isEditMode = false;
  private wsSubscription: Subscription | null = null;

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.wsSubscription = this.webSocketService.connect().subscribe(
      (message: WebSocketMessage) => this.handleWebSocketMessage(message)
    );
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    console.log('WebSocket message received:', message);
    
    const { type, data } = message;

    // Update active case if IDs match
    if (this.activeCase && data?.id === this.activeCase.id) {
      switch (type) {
        case 'CREATE':
          this.activeCase = data;
          break;
        case 'ACKNOWLEDGE':
          // Update acknowledged status
          this.activeCase = { ...this.activeCase, acknowledged: data.acknowledged };
          break;
        case 'UPDATE':
          this.activeCase = data;
          break;
        case 'END':
          this.activeCase = { ...this.activeCase, isActive: data.isActive };
          break;
        default:
          console.log('Unknown message type:', type);
      }
    } else if (type === 'CREATE' && !this.activeCase) {
      // If no active case, set newly created case as active
      this.activeCase = data;
    }
  }

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
      this.activeCase = { ...this.activeCase, isActive: false };
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