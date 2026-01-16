import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CaseModel } from '../models/case-model';

export interface WebSocketMessage {
  type: 'CREATE' | 'UPDATE' | 'ACKNOWLEDGE' | 'DELETE' | 'LOCATION_UPDATE';
  data?: CaseModel;
  caseId?: number;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class CaseWebSocketService {
  private ws?: WebSocket;
  private reconnectInterval?: any;
  private reconnectDelay = 3000;

  // Subject za case update poruke
  private messageSubject = new BehaviorSubject<WebSocketMessage | null>(null);
  public message$ = this.messageSubject.asObservable();

  // Subject za connection status
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  connect() {
    const wsUrl = 'ws://localhost:8080/ws/cases';
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to /ws/cases');
        this.connectedSubject.next(true);
        
        // Clear any reconnect attempts
        if (this.reconnectInterval) {
          clearTimeout(this.reconnectInterval);
          this.reconnectInterval = undefined;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          this.messageSubject.next(message);
        } catch (e) {
          console.error('❌ Error parsing WebSocket message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket closed, reconnecting in', this.reconnectDelay / 1000, 'seconds...');
        this.connectedSubject.next(false);
        
        // Auto-reconnect after delay
        this.reconnectInterval = setTimeout(() => {
          this.connect();
        }, this.reconnectDelay);
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.connectedSubject.next(false);
    }
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = undefined;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    
    this.connectedSubject.next(false);
  }

  /**
   * Send a location update for a specific case
   */
  sendLocationUpdate(caseId: number, latitude: number, longitude: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send location update');
      return;
    }

    const message = {
      type: 'LOCATION_UPDATE',
      caseId,
      latitude,
      longitude
    };

    console.log('📤 Sending location update:', message);
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
