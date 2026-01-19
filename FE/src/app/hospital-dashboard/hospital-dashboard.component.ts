import { Component, ViewChild, inject, OnInit, computed, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaseService } from '../services/case-store.service';
import { CaseModel } from '../models/case-model';
import { CasesOverviewComponent } from './cases-overview.component';
import { CaseDetailComponent } from './case-detail.component';

type PriorityChip = { text: string; cls: string };
type StatusChip = { text: string; cls: string };

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CasesOverviewComponent, CaseDetailComponent],
  templateUrl: './hospital-dashboard.component.html',
})
export class HospitalDashboardComponent implements OnInit, OnDestroy {
  readonly store = inject(CaseService);
  private sub?: Subscription;

  messageText = '';

  @ViewChild(CaseDetailComponent) detail?: CaseDetailComponent;

  ngOnInit() {
    this.sub = this.store.getAllCases().subscribe();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  selectCase(c: CaseModel) {
    this.store.selectCase(c);
    setTimeout(() => this.detail?.scrollChatToBottom(), 0);
  }

  deselect() {
    this.store.selectCase(null);
  }

  acknowledge(caseId: number | string) {
    const id = typeof caseId === 'string' ? parseInt(caseId) : caseId;
    this.store.acknowledgeCase(id).subscribe({
      next: () => console.log(`Case #${id} potvrđen`),
      error: (err) => console.error('Error acknowledging case:', err),
    });
  }

  send(caseId: number | string) {
    const text = this.messageText.trim();
    if (!text) return;

    console.log(`Message sent to case #${caseId}: ${text}`);

    this.messageText = '';
    setTimeout(() => this.detail?.scrollChatToBottom(), 0);
  }

  isActive(c: CaseModel): boolean {
    return c.status !== 'CLOSED';
  }

  priorityChip(p: CaseModel['priority']): PriorityChip {
    switch (p) {
      case 'HIGH':
        return {
          text: 'VISOKO',
          cls: 'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] border border-[color:var(--border)]'
        };
      case 'MEDIUM':
        return {
          text: 'SREDNJE',
          cls: 'bg-[color:var(--muted)] text-[color:var(--foreground)] border border-[color:var(--border)]'
        };
      default:
        return {
          text: 'NISKO',
          cls: 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border border-[color:var(--border)]'
        };
    }
  }

  statusChip(s: CaseModel['status'] | undefined): StatusChip {
    switch (s) {
      case 'SENT':
        return {
          text: 'Poslano',
          cls: 'bg-[color:var(--secondary)] text-[color:var(--secondary-foreground)] border border-[color:var(--border)]'
        };
      case 'ACKNOWLEDGED':
        return {
          text: 'Potvrđeno',
          cls: 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)] border border-[color:var(--border)]'
        };
      case 'CLOSED':
        return {
          text: 'Zatvoreno',
          cls: 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border border-[color:var(--border)]'
        };
      default:
        return {
          text: 'Draft',
          cls: 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border border-[color:var(--border)]'
        };
    }
  }
}