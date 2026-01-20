import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { CreateCaseDTO } from '../models/case.model';

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
      this.apiUrl = `${config.Urls.apiUrl}/cases`;
    });
  }


  // ----- BASIC CRUD -----
  getAllCases(): Observable<Case[]> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.Urls.apiUrl}/cases`;
        return this.http.get<Case[]>(url).pipe(
          catchError(this.handleError)
        );
      })
    );
  }

  getCaseById(id: number): Observable<Case> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.Urls.apiUrl}/cases/${id}`;
        return this.http.get<Case>(url).pipe(
          catchError(this.handleError)
        );
      })
    );
  }

  deleteCase(id: number): Observable<void> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.Urls.apiUrl}/cases/${id}`;
        return this.http.delete<void>(url).pipe(
          catchError(this.handleError)
        );
      })
    );
  }

  // ----- REGULAR CASE -----
  createRegularCase(caseData: CreateCaseDTO, token?: string): Observable<any> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.Urls.apiUrl}/cases/regular`;
        const headers = this.createHeaders(token);
        return this.http.post(url, caseData, { headers }).pipe(
          catchError(this.handleError)
        );
      })
    );
  }

  updateRegularCase(caseId: string, caseData: CreateCaseDTO, token?: string): Observable<any> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.Urls.apiUrl}/cases/${caseId}`;
        const headers = this.createHeaders(token);
        return this.http.put(url, caseData, { headers }).pipe(
          catchError(this.handleError)
        );
      })
    );
  }

  // ----- HELPERS -----
  private createHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('userId', '1'); // TODO: Replace with actual user ID from auth service

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
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
