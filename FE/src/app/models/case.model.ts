export interface Case {
  id: number; // Changed from string
  patientName: string;
  birthYear: number;
  age?: number; 
  sex: 'M' | 'F';
  description: string;
  
  // Vitals
  bpm: number;
  systolicPressure: number;
  diastolicPressure: number;
  resRate: number;
  saturation: number;
  temperature: number;
  
  // Location
  latitude: number;
  longitude: number;
  
  // Metadata - from backend
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isSos: boolean;
  acknowledged: boolean;
  isActive: boolean;
  createdAt: string; // ISO date string
  createdById: number;
  
  // Frontend-only fields (optional)
  status?: 'active' | 'sent' | 'completed';
  eta?: number;
}

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