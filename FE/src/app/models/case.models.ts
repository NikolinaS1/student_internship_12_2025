export type CasePriority = 'CRITICAL' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseStatus = 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'CLOSED';

export interface Vitals {
  hr?: number;       // bpm
  bp?: string;       // "120/80"
  o2?: number;       // %
}

export interface CaseMessage {
  id: string;
  caseId: string;
  senderRole: 'EMS' | 'HOSPITAL';
  senderName: string;
  text: string;
  timestampIso: string; // ISO string
}

export interface EmsCase {
  id: string;
  patientName: string;
  age: number;
  priority: CasePriority;
  priorityLevel?: number; // optional numeric (like “Priority 5”)
  status: CaseStatus;
  etaMinutes: number;
  createdIso: string;

  summary: string;       // short description
  condition: string;     // e.g., "Gunshot Wound"
  consciousness: string; // e.g., "Alert", "Semi-conscious"
  vitals: Vitals;

  messages: CaseMessage[];
}
