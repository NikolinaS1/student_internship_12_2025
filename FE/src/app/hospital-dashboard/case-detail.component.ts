import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaseModel } from '../models/case-model';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './case-detail.component.html',
})
export class CaseDetailComponent implements AfterViewInit {
  @Input({ required: true }) selectedCase!: CaseModel;
  

  @Input() messageText = '';
  @Output() messageTextChange = new EventEmitter<string>();

  @Output() deselect = new EventEmitter<void>();
  @Output() acknowledge = new EventEmitter<number>();
  @Output() send = new EventEmitter<number>();

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  ngAfterViewInit() {
    // initial scroll when detail view opens
    setTimeout(() => this.scrollChatToBottom(), 0);
  }

  scrollChatToBottom() {
    const el = this.chatScroll?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  onSend() {
    if (!this.selectedCase) return;
    this.send.emit(this.selectedCase.id);
    // scroll after parent adds the message
    setTimeout(() => this.scrollChatToBottom(), 0);
  }

  onAcknowledge() {
    if (!this.selectedCase) return;
    this.acknowledge.emit(this.selectedCase.id);
  }

  onDeselect() {
    this.deselect.emit();
  }

  // Helper metode za prikaz podataka
  getStatusText(): string {
    switch (this.selectedCase?.status) {
      case 'ACKNOWLEDGED':
        return 'Potvrđeno';
      case 'SENT':
        return 'Poslano';
      case 'CLOSED':
        return 'Zatvoreno';
      default:
        return 'Draft';
    }
  }

  getStatusClass(): string {
    switch (this.selectedCase?.status) {
      case 'ACKNOWLEDGED':
        return 'status-acknowledged';
      case 'SENT':
        return 'status-sent';
      case 'CLOSED':
        return 'status-closed';
      default:
        return 'status-draft';
    }
  }

  getPriorityClass(): string {
    switch (this.selectedCase?.priority) {
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  }

  getAge(): number | null {
    if (!this.selectedCase?.birthYear) return null;
    return new Date().getFullYear() - this.selectedCase.birthYear;
  }

  getVitalSigns(): { label: string; value: string | number }[] {
    const vitals: { label: string; value: string | number }[] = [];

    if (this.selectedCase?.bpm) {
      vitals.push({ label: 'BPM', value: `${this.selectedCase.bpm} bpm` });
    }
    if (this.selectedCase?.temperature) {
      vitals.push({ label: 'Temperatura', value: `${this.selectedCase.temperature}°C` });
    }
    if (this.selectedCase?.saturation) {
      vitals.push({ label: 'Zasićenost O₂', value: `${this.selectedCase.saturation}%` });
    }
    if (this.selectedCase?.resRate) {
      vitals.push({ label: 'Frekvencija disanja', value: `${this.selectedCase.resRate}` });
    }
    if (this.selectedCase?.systolicPressure && this.selectedCase?.diastolicPressure) {
      vitals.push({
        label: 'Krvni tlak',
        value: `${this.selectedCase.systolicPressure}/${this.selectedCase.diastolicPressure} mmHg`,
      });
    }

    return vitals;
  }

  isActive(): boolean {
    return this.selectedCase?.status !== 'CLOSED';
  }

  isAcknowledged(): boolean {
    return this.selectedCase?.acknowledged ?? false;
  }
}