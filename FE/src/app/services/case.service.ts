import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCaseDTO, Case } from '../models/case.model';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private readonly apiUrl = 'http://localhost:8080/cases';

  constructor(private http: HttpClient) {}

  createRegularCase(caseData: CreateCaseDTO, token?: string): Observable<any> {
    let httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('userId', '1')
    
    if (token) {
      httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post(`${this.apiUrl}/regular`, caseData, { headers: httpHeaders });
  }

  updateRegularCase(caseId: string, caseData: CreateCaseDTO, token?: string): Observable<any> {
    let httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('userId', '1');
    
    if (token) {
      httpHeaders = httpHeaders.set('Authorization', `Bearer ${token}`);
    }

    return this.http.put(`${this.apiUrl}/${caseId}`, caseData, { headers: httpHeaders });
  }
}