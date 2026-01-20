import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CaseModel } from '../hospital-models/case-model';
import { AuthService } from './auth-service';
import { CaseWebSocketService } from './case-websocket.service';
import { ConfigService } from './config-service';

@Injectable({ providedIn: 'root' })
export class CaseService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private wsService = inject(CaseWebSocketService);
  private configService = inject(ConfigService);

  private get API_URL(): string {
    return this.configService.apiUrl + '/cases';
  }

  cases = signal<CaseModel[]>([]);
  selectedCase = signal<CaseModel | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    this.initWebSocket();
  }

  /**
   * Initialize WebSocket and listen for messages
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
   * Handle new case (CREATE)
   */
  private handleCaseCreate(caseData: CaseModel) {
    const processedCase = this.processCase(caseData);

    // Check if case already exists
    if (!this.cases().find(c => c.id === caseData.id)) {
      this.cases.update(cases => [...cases, processedCase]);
      console.log('✅ New case added:', processedCase.id);
    }
  }

  /**
   * Handle case update (UPDATE/ACKNOWLEDGE)
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

      // Update selected case if it matches
      if (this.selectedCase()?.id === caseData.id) {
        this.selectedCase.set(this.processCase(caseData));
      }
    }
  }

  /**
   * Handle case deletion (DELETE)
   */
  private handleCaseDelete(caseId: number) {
    const filtered = this.cases().filter(c => c.id !== caseId);

    if (filtered.length !== this.cases().length) {
      this.cases.set(filtered);
      console.log('✅ Case deleted:', caseId);

      // Clear selected case if deleted
      if (this.selectedCase()?.id === caseId) {
        this.selectedCase.set(null);
      }
    }
  }

  /**
   * Handle location update for case
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

      // Update selected case if it matches
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
   * Get all cases (GET /cases)
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
   * Get specific case (GET /cases/{id})
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
   * Acknowledge case (PUT /cases/{id}/acknowledge)
   */
  acknowledgeCase(id: number): Observable<CaseModel> {
    this.loading.set(true);
    this.error.set(null);

    const body = { acknowledged: true };

    return this.http.put<CaseModel>(`${this.API_URL}/${id}/acknowledge`, body, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((updatedCase) => {
        // Update in list
        const idx = this.cases().findIndex((c) => c.id === id);
        if (idx >= 0) {
          this.cases.update(cases => {
            const updated = [...cases];
            updated[idx] = this.processCase(updatedCase);
            return updated;
          });
        }

        // Update selected case if it matches
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
   * Manually refresh all cases
   */
  refreshCases(): Observable<CaseModel[]> {
    return this.getAllCases();
  }

  /**
   * Process case data (transformation, mapping)
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
   * Prepare HTTP headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Setter for selected case
   */
  selectCase(caseData: CaseModel | null) {
    this.selectedCase.set(caseData);
  }

  /**
   * Getter for current cases
   */
  getCasesSync(): CaseModel[] {
    return this.cases();
  }

  /**
   * Getter for selected case
   */
  getSelectedCaseSync(): CaseModel | null {
    return this.selectedCase();
  }
}