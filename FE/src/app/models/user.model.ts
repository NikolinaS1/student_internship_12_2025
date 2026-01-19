export interface User {
  id: string;
  name: string;
  role: 'ems-technician' | 'dispatcher' | 'admin';
  password: string; 
  location?: string; 
}