import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CaseModel } from '../models/case-model';
import { AuthService } from '../services/auth-service';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly API_URL = 'http://localhost:8080/cases';

  // BehaviorSubject za real-time ažuriranje
  private casesSubject = new BehaviorSubject<CaseModel[]>([]);
  public cases$ = this.casesSubject.asObservable();

  private selectedCaseSubject = new BehaviorSubject<CaseModel | null>(null);
  public selectedCase$ = this.selectedCaseSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Auto-refresh svakih 10 sekundi
  private autoRefresh$ = interval(100000).pipe(
    switchMap(() => this.getAllCases())
  );

  constructor() {
    this.initAutoRefresh();
  }

  /**
   * Dohvati sve caseove (GET /cases)
   */
  getAllCases(): Observable<CaseModel[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    console.log('🔄 Dohvaćam cases sa:', this.API_URL);

    return this.http.get<CaseModel[]>(this.API_URL).pipe(
      tap((cases) => {
        console.log('✅ Backend odgovorio sa:', cases);
        
        // Procesira cases
        const processedCases = Array.isArray(cases) 
          ? cases.map(c => this.processCase(c))
          : [];
        
        console.log('📋 Procesiran broj slučajeva:', processedCases.length);
        
        this.casesSubject.next(processedCases);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('❌ Greška pri učitavanju slučajeva:', error);
        const errorMsg = 'Greška pri učitavanju slučajeva';
        this.errorSubject.next(errorMsg);
        this.loadingSubject.next(false);
        // ← VAŽNO: Vrati prazan niz umjesto da baci error!
        return of([]);
      })
    );
  }

  /**
   * Dohvati specifičan case (GET /cases/{id})
   */
  getCase(id: number): Observable<CaseModel> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<CaseModel>(`${this.API_URL}/${id}`).pipe(
      tap((caseData) => {
        const processedCase = this.processCase(caseData);
        this.selectedCaseSubject.next(processedCase);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error(`❌ Greška pri učitavanju slučaja #${id}:`, error);
        const errorMsg = `Greška pri učitavanju slučaja #${id}`;
        this.errorSubject.next(errorMsg);
        this.loadingSubject.next(false);
        return of(null as any); // ← Vrati null umjesto da baci error
      })
    );
  }

  /**
   * Potvrdi primanje slučaja (PUT /cases/{id}/acknowledge)
   */
  acknowledgeCase(id: number): Observable<CaseModel> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const body = { acknowledged: true };

    return this.http.put<CaseModel>(`${this.API_URL}/${id}/acknowledge`, body, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((updatedCase) => {
        // Ažuriraj u listi
        const cases = this.casesSubject.value;
        const idx = cases.findIndex((c) => c.id === id);
        if (idx >= 0) {
          cases[idx] = this.processCase(updatedCase);
          this.casesSubject.next([...cases]);
        }

        // Ažuriraj selektirani case ako je isti
        if (this.selectedCaseSubject.value?.id === id) {
          this.selectedCaseSubject.next(this.processCase(updatedCase));
        }

        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        const errorMsg = `Greška pri potvrdi slučaja #${id}`;
        this.errorSubject.next(errorMsg);
        this.loadingSubject.next(false);
        console.error(errorMsg, error);
        throw error;
      })
    );
  }

  /**
   * Manualno osvježi sve slučajeve
   */
  refreshCases(): Observable<CaseModel[]> {
    return this.getAllCases();
  }

  /**
   * Procesira case podatke (transformacija, mapiranje)
   */
  private processCase(caseData: CaseModel): CaseModel {
    const age = new Date().getFullYear() - caseData.birthYear;

    // Mapiranje prioriteta na status
    let status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'CLOSED' = 'SENT';
    if (caseData.acknowledged) {
      status = 'ACKNOWLEDGED';
    }
    if (!caseData.isActive) {
      status = 'CLOSED';
    }

    // Kreiraj summary od dostupnih podataka
    let summary = caseData.description;
    if (caseData.bpm) {
      summary += ` • ❤️ ${caseData.bpm} bpm`;
    }
    if (caseData.temperature) {
      summary += ` • 🌡️ ${caseData.temperature}°C`;
    }

    return {
      ...caseData,
      status,
      summary,
    };
  }

  /**
   * Pripremi HTTP headers sa JWT tokenom
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Auto-refresh svakih 10 sekundi
   */
  private initAutoRefresh() {
    this.autoRefresh$.subscribe();
  }

  /**
   * Setter za selektirani case
   */
  selectCase(caseData: CaseModel) {
    this.selectedCaseSubject.next(caseData);
  }

  /**
   * Getter za trenutne caseove
   */
  getCasesSync(): CaseModel[] {
    return this.casesSubject.value;
  }

  /**
   * Getter za selektirani case
   */
  getSelectedCaseSync(): CaseModel | null {
    return this.selectedCaseSubject.value;
  }

  
}