import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, map } from 'rxjs';
import { CaseService } from '../services/case-store.service';
import { CaseModel } from '../models/case-model';
import { CasesOverviewComponent } from './cases-overview.component';
import { CaseDetailComponent } from './case-detail.component';
import { HospitalMapComponent } from '../map/map-component';

type PriorityChip = { text: string; cls: string };
type StatusChip = { text: string; cls: string };

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, AsyncPipe, NgIf, NgFor, NgClass, FormsModule, DatePipe, CasesOverviewComponent, CaseDetailComponent, HospitalMapComponent],
  templateUrl: './hospital-dashboard.component.html',
})
export class HospitalDashboardComponent implements OnInit {
  private readonly store = inject(CaseService);

  // Koristi selectedCase$ umjesto selectedCaseId$
  readonly vm$ = combineLatest([this.store.cases$, this.store.selectedCase$]).pipe(
    map(([cases, selected]) => {
      const selectedId = selected?.id ?? null;
      return { cases, selectedId, selected };
    })
  );

  messageText = '';

  @ViewChild(CaseDetailComponent) detail?: CaseDetailComponent;

  ngOnInit() {
    // Učitaj sve slučajeve na početku
    this.store.getAllCases().subscribe();
  }

  selectCase(c: CaseModel) {
    this.store.selectCase(c);
    setTimeout(() => this.detail?.scrollChatToBottom(), 0);
  }

  deselect() {
    this.store.selectCase(null as any); // Null za deselect
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

    // TODO: Implementiraj chat funkcionalnost ako je potrebna
    console.log(`Message sent to case #${caseId}: ${text}`);

    this.messageText = '';
    setTimeout(() => this.detail?.scrollChatToBottom(), 0);
  }

  isActive(c: CaseModel): boolean {
    return c.status !== 'CLOSED';
  }

  // UI helpers
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