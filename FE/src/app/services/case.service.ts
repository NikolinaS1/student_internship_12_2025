import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';


export interface Case {
  id: number;
  acknowledged: boolean;
  birthYear: number;
  bpm: number;
  createdAt: string;
  createdById: number;
  description: string;
  diastolicPressure: number;
  isActive: boolean;
  isSos: boolean;
  patientName: string;
  priority: string;
  resRate: number;
  saturation: number;
  sex: string;
  systolicPressure: number;
  temperature: number;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {

  private apiUrl = '';

  constructor(
  private http: HttpClient,
  private configService: ConfigService
) {
  this.configService.getConfig().subscribe(config => {
    this.apiUrl = `${config.apiUrl}/cases`;
  });
}


  getAllCases(): Observable<Case[]> {
    return this.http.get<Case[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getCaseById(id: number): Observable<Case> {
    return this.http.get<Case>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  deleteCase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
