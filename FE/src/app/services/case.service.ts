import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { CreateCaseDTO } from '../models/case.model';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  private createHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('userId', '1'); // TODO: Replace with actual user ID from auth service

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  createRegularCase(caseData: CreateCaseDTO, token?: string): Observable<any> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.apiUrl}/cases/regular`;
        const headers = this.createHeaders(token);
        return this.http.post(url, caseData, { headers });
      })
    );
  }

  updateRegularCase(caseId: string, caseData: CreateCaseDTO, token?: string): Observable<any> {
    return this.configService.getConfig().pipe(
      switchMap(config => {
        const url = `${config.apiUrl}/cases/${caseId}`;
        const headers = this.createHeaders(token);
        return this.http.put(url, caseData, { headers });
      })
    );
  }
}