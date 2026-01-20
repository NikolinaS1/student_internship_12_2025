import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { ConfigService } from './config.service';

export interface WebSocketMessage {
  type: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  constructor(private configService: ConfigService) {}

  connect(): Observable<WebSocketMessage> {
    this.configService.getConfig().subscribe(config => {
      this.establishConnection(config.wsUrl);
    });

    return this.messageSubject.asObservable();
  }

  private establishConnection(wsUrl: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const rawMessage = JSON.parse(event.data);
        console.log('Raw WebSocket message:', rawMessage);
        
        const message: WebSocketMessage = {
          type: rawMessage.action || rawMessage.type,
          data: rawMessage.case || rawMessage.data
        };
        
        this.messageSubject.next(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(wsUrl);
    };
  }

  private attemptReconnect(wsUrl: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      timer(this.reconnectInterval).subscribe(() => {
        this.establishConnection(wsUrl);
      });
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.messageSubject.complete();
  }
}