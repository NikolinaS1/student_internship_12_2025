import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config$: Observable<AppConfig> | null = null;

  constructor(private http: HttpClient) {}

  loadConfig(): Observable<AppConfig> {
    if (!this.config$) {
      this.config$ = this.http.get<AppConfig>('/assets/config.json').pipe(
        shareReplay(1),
        catchError((error) => {
          console.error('Error loading config:', error);
          throw error;
        })
      );
    }
    return this.config$;
  }

  getConfig(): Observable<AppConfig> {
    return this.loadConfig();
  }
}