import { Component, ViewChild, inject } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, map } from 'rxjs';
import { CaseStoreService } from '../services/case-store.service';
import { EmsCase } from '../models/case.models';
import { CasesOverviewComponent } from './cases-overview.component';
import { CaseDetailComponent } from './case-detail.component';

type PriorityChip = { text: string; cls: string };
type StatusChip = { text: string; cls: string };

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe, NgIf, NgFor, NgClass, FormsModule, DatePipe, CasesOverviewComponent, CaseDetailComponent],
  templateUrl: './hospital-dashboard.component.html',
})
export class HospitalDashboardComponent {
  private readonly store = inject(CaseStoreService);

  readonly vm$ = combineLatest([this.store.cases$, this.store.selectedCaseId$]).pipe(
    map(([cases, selectedId]) => {
      const selected = selectedId ? cases.find(c => c.id === selectedId) ?? null : null;
      return { cases, selectedId, selected };
    })
  );

  messageText = '';

  @ViewChild(CaseDetailComponent) detail?: CaseDetailComponent;

  selectCase(c: EmsCase) {
    this.store.selectCase(c.id);
    setTimeout(() => this.detail?.scrollChatToBottom(), 0);
  }

  deselect() {
    this.store.selectCase(null);
  }

  acknowledge(caseId: string) {
    this.store.acknowledge(caseId);
  }

  send(caseId: string) {
    const text = this.messageText.trim();
    if (!text) return;

    this.store.addMessage(caseId, {
      senderRole: 'HOSPITAL',
      senderName: 'Hospital Dispatch',
      text,
    });

    this.messageText = '';
    setTimeout(() => this.detail?.scrollChatToBottom(), 0);
  }

  resetDemo() {
    this.store.resetDemo();
  }

  // prikazuj samo "aktivne" u gridu (po želji prilagodi)
  isActive(c: EmsCase) {
    return c.status !== 'CLOSED';
  }

  // UI helpers
  priorityChip(p: EmsCase['priority']): PriorityChip {
    switch (p) {
      case 'CRITICAL':
        return { text: 'KRITIČNO', cls: 'bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)]' };
      case 'URGENT':
        return { text: 'HITNO', cls: 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)] border border-[color:var(--border)]' };
      case 'HIGH':
        return { text: 'VISOKO', cls: 'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] border border-[color:var(--border)]' };
      case 'MEDIUM':
        return { text: 'SREDNJE', cls: 'bg-[color:var(--muted)] text-[color:var(--foreground)] border border-[color:var(--border)]' };
      default:
        return { text: 'NISKO', cls: 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border border-[color:var(--border)]' };
    }
  }

  statusChip(s: EmsCase['status']): StatusChip {
    switch (s) {
      case 'SENT':
        return { text: 'Poslano', cls: 'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] border border-[color:var(--border)]' };
      case 'ACKNOWLEDGED':
        return { text: 'Potvrđeno', cls: 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)] border border-[color:var(--border)]' };
      case 'CLOSED':
        return { text: 'Zatvoreno', cls: 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border border-[color:var(--border)]' };
      default:
        return { text: 'Draft', cls: 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border border-[color:var(--border)]' };
    }
  }
}
