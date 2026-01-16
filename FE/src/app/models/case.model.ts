export interface Case {
  id: string;
  patientName: string;
  birthYear: number;
  age: number;
  sex: 'M' | 'F';
  quickSymptoms?: string[]; // Dodaj ovo
  description: string; // symptoms + quickSymptoms
  
  bpm: number; 
  systolicPressure: number;
  diastolicPressure: number;
  resRate: number; 
  saturation: number; 
  temperature: number;
  
  // Location
  latitude: number;
  longitude: number;
  
  // Metadata
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'active' | 'sent' | 'completed';
  eta?: number; // in minutes
  createdAt: Date;
  createdBy: string; // user ID
  isSOS: boolean;
}

// Data Transfer Object for creating a new case
export interface CreateCaseDTO {
  patientName: string;
  birthYear: number;
  sex: 'M' | 'F';
  description: string;
  bpm: number;
  systolicPressure: number;
  diastolicPressure: number;
  resRate: number;
  saturation: number;
  temperature: number;
  latitude: number;
  longitude: number;
}