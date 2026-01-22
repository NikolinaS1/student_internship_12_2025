import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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
  private casesSubject = new BehaviorSubject<Case[]>([]);
  public cases$ = this.casesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.configService.getConfig().subscribe(config => {
      this.apiUrl = `${config.Urls.apiUrl}/cases`;
      this.loadCases();
    });
  }

  private loadCases(): void {
    this.http.get<Case[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    ).subscribe({
      next: (cases) => {
        this.casesSubject.next(cases);
      },
      error: (error) => {
        console.error('Error loading cases:', error);
      }
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
    return new Observable(observer => {
      this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        catchError(this.handleError)
      ).subscribe({
        next: () => {
          this.loadCases(); // Refresh cases after deletion
          observer.next();
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
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

  updateRegularCase(caseId: number, caseData: CreateCaseDTO, token?: string): Observable<any> {
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