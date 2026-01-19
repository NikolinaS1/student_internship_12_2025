import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CaseModel } from '../models/case-model';
import { AuthService } from '../services/auth-service';
import { CaseWebSocketService } from './case-websocket.service';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private wsService = inject(CaseWebSocketService);

  private readonly API_URL = 'http://localhost:8080/cases';

  // Zamjena BehaviorSubject sa Signals
  cases = signal<CaseModel[]>([]);
  selectedCase = signal<CaseModel | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    this.initWebSocket();
  }

  /**
   * Inicijaliziraj WebSocket i slušaj poruke
   */
  private initWebSocket() {
    this.wsService.connect();

    this.wsService.message$.subscribe((message) => {
      if (!message) return;

      console.log('🔔 Case update received:', message);

      switch (message.type) {
        case 'CREATE':
          if (message.data) {
            this.handleCaseCreate(message.data);
          }
          break;

        case 'UPDATE':
        case 'ACKNOWLEDGE':
          if (message.data) {
            this.handleCaseUpdate(message.data);
          }
          break;

        case 'DELETE':
          if (message.data?.id) {
            this.handleCaseDelete(message.data.id);
          }
          break;

        case 'LOCATION_UPDATE':
          if (message.caseId && message.latitude && message.longitude) {
            this.handleLocationUpdate(message.caseId, message.latitude, message.longitude);
          }
          break;
      }
    });
  }

  /**
   * Handle novi case (CREATE)
   */
  private handleCaseCreate(caseData: CaseModel) {
    const processedCase = this.processCase(caseData);
    
    // Provjeri da case već ne postoji
    if (!this.cases().find(c => c.id === caseData.id)) {
      this.cases.update(cases => [...cases, processedCase]);
      console.log('✅ New case added:', processedCase.id);
    }
  }

  /**
   * Handle ažuriranje case-a (UPDATE/ACKNOWLEDGE)
   */
  private handleCaseUpdate(caseData: CaseModel) {
    const idx = this.cases().findIndex(c => c.id === caseData.id);

    if (idx >= 0) {
      this.cases.update(cases => {
        const updated = [...cases];
        updated[idx] = this.processCase(caseData);
        return updated;
      });
      console.log('✅ Case updated:', caseData.id);

      // Ažuriraj i selektirani case ako je isti
      if (this.selectedCase()?.id === caseData.id) {
        this.selectedCase.set(this.processCase(caseData));
      }
    }
  }

  /**
   * Handle brisanje case-a (DELETE)
   */
  private handleCaseDelete(caseId: number) {
    const filtered = this.cases().filter(c => c.id !== caseId);

    if (filtered.length !== this.cases().length) {
      this.cases.set(filtered);
      console.log('✅ Case deleted:', caseId);

      // Očisti selektirani case ako je obrisan
      if (this.selectedCase()?.id === caseId) {
        this.selectedCase.set(null);
      }
    }
  }

  /**
   * Handle location update za case
   */
  private handleLocationUpdate(caseId: number, latitude: number, longitude: number) {
    const idx = this.cases().findIndex(c => c.id === caseId);

    if (idx >= 0) {
      this.cases.update(cases => {
        const updated = [...cases];
        updated[idx] = {
          ...updated[idx],
          latitude,
          longitude
        };
        return updated;
      });
      console.log('✅ Location updated for case:', caseId, latitude, longitude);

      // Ažuriraj i selektirani case ako je isti
      if (this.selectedCase()?.id === caseId) {
        this.selectedCase.update(current => current ? {
          ...current,
          latitude,
          longitude
        } : null);
      }
    }
  }

  /**
   * Dohvati sve caseove (GET /cases)
   */
  getAllCases(): Observable<CaseModel[]> {
    this.loading.set(true);
    this.error.set(null);

    console.log('🔄 Dohvaćam cases sa:', this.API_URL);

    return this.http.get<CaseModel[]>(this.API_URL).pipe(
      tap((cases) => {
        console.log('✅ Backend odgovorio sa:', cases);
        
        const processedCases = Array.isArray(cases) 
          ? cases.map(c => this.processCase(c))
          : [];
        
        console.log('📋 Procesiran broj slučajeva:', processedCases.length);
        
        this.cases.set(processedCases);
        this.loading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Greška pri učitavanju slučajeva:', error);
        this.error.set('Greška pri učitavanju slučajeva');
        this.loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Dohvati specifičan case (GET /cases/{id})
   */
  getCase(id: number): Observable<CaseModel> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<CaseModel>(`${this.API_URL}/${id}`).pipe(
      tap((caseData) => {
        const processedCase = this.processCase(caseData);
        this.selectedCase.set(processedCase);
        this.loading.set(false);
      }),
      catchError((error) => {
        console.error(`❌ Greška pri učitavanju slučaja #${id}:`, error);
        this.error.set(`Greška pri učitavanju slučaja #${id}`);
        this.loading.set(false);
        return of(null as any);
      })
    );
  }

  /**
   * Potvrdi primanje slučaja (PUT /cases/{id}/acknowledge)
   */
  acknowledgeCase(id: number): Observable<CaseModel> {
    this.loading.set(true);
    this.error.set(null);

    const body = { acknowledged: true };

    return this.http.put<CaseModel>(`${this.API_URL}/${id}/acknowledge`, body, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((updatedCase) => {
        // Ažuriraj u listi
        const idx = this.cases().findIndex((c) => c.id === id);
        if (idx >= 0) {
          this.cases.update(cases => {
            const updated = [...cases];
            updated[idx] = this.processCase(updatedCase);
            return updated;
          });
        }

        // Ažuriraj selektirani case ako je isti
        if (this.selectedCase()?.id === id) {
          this.selectedCase.set(this.processCase(updatedCase));
        }

        this.loading.set(false);
      }),
      catchError((error) => {
        this.error.set(`Greška pri potvrdi slučaja #${id}`);
        this.loading.set(false);
        console.error('Greška pri potvrdi slučaja', error);
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

    let status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'CLOSED' = 'SENT';
    if (caseData.acknowledged) {
      status = 'ACKNOWLEDGED';
    }
    if (!caseData.isActive) {
      status = 'CLOSED';
    }

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
   * Setter za selektirani case
   */
  selectCase(caseData: CaseModel) {
    this.selectedCase.set(caseData);
  }

  /**
   * Getter za trenutne caseove
   */
  getCasesSync(): CaseModel[] {
    return this.cases();
  }

  /**
   * Getter za selektirani case
   */
  getSelectedCaseSync(): CaseModel | null {
    return this.selectedCase();
  }
}