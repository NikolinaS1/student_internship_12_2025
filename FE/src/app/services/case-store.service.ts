import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EmsCase, CaseMessage, CaseStatus } from '../models/case.models';
import { MOCK_CASES } from '../data/mock-cases';

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

@Injectable({ providedIn: 'root' })
export class CaseStoreService {
  private readonly casesSubject = new BehaviorSubject<EmsCase[]>(
    // clone to avoid accidental mutation of MOCK_CASES
    MOCK_CASES.map(c => ({ ...c, messages: c.messages.map(m => ({ ...m })) }))
  );

  private readonly selectedCaseIdSubject = new BehaviorSubject<string | null>(null);

  readonly cases$ = this.casesSubject.asObservable();
  readonly selectedCaseId$ = this.selectedCaseIdSubject.asObservable();

  get snapshotCases(): EmsCase[] {
    return this.casesSubject.value;
  }

  selectCase(caseId: string | null) {
    this.selectedCaseIdSubject.next(caseId);
  }

  acknowledge(caseId: string) {
    this.patchCase(caseId, { status: 'ACKNOWLEDGED' });
    this.addMessage(caseId, {
      senderRole: 'HOSPITAL',
      senderName: 'Hospital Dispatch',
      text: 'Acknowledged by hospital.',
    });
  }

  closeCase(caseId: string) {
    this.patchCase(caseId, { status: 'CLOSED' });
    this.addMessage(caseId, {
      senderRole: 'HOSPITAL',
      senderName: 'Hospital Dispatch',
      text: 'Case closed.',
    });
  }

  addMessage(
    caseId: string,
    msg: Pick<CaseMessage, 'senderRole' | 'senderName' | 'text'>
  ) {
    const nowIso = new Date().toISOString();
    const message: CaseMessage = {
      id: uid('MSG'),
      caseId,
      senderRole: msg.senderRole,
      senderName: msg.senderName,
      text: msg.text.trim(),
      timestampIso: nowIso,
    };

    const updated = this.snapshotCases.map(c =>
      c.id === caseId ? { ...c, messages: [...c.messages, message] } : c
    );
    this.casesSubject.next(updated);
  }

  updateEta(caseId: string, etaMinutes: number) {
    this.patchCase(caseId, { etaMinutes });
  }

  updateStatus(caseId: string, status: CaseStatus) {
    this.patchCase(caseId, { status });
  }

  resetDemo() {
    this.casesSubject.next(
      MOCK_CASES.map(c => ({ ...c, messages: c.messages.map(m => ({ ...m })) }))
    );
    this.selectCase(null);
  }

  private patchCase(caseId: string, patch: Partial<EmsCase>) {
    const updated = this.snapshotCases.map(c => (c.id === caseId ? { ...c, ...patch } : c));
    this.casesSubject.next(updated);
  }
}
