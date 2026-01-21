import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { ConfigService } from './config-service';

export interface Message {
  id: number;
  caseId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessageWebSocketService {
  private configService = inject(ConfigService);
  private http = inject(HttpClient);

  private ws?: WebSocket;
  private reconnectInterval?: any;
  private reconnectDelay = 3000;
  private currentCaseId?: number;

  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  /**
   * Connect to WebSocket for specific case
   */
  connect(caseId: number, userId: number) {
    // Disconnect previous connection
    this.disconnect();

    this.currentCaseId = caseId;
    this.fetchHistory(caseId);

    const wsUrl = `${this.configService.sendMsgUrl}/${caseId}/${userId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connectedSubject.next(true);

        if (this.reconnectInterval) {
          clearTimeout(this.reconnectInterval);
          this.reconnectInterval = undefined;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle snapshot (array of messages)
          if (Array.isArray(data)) {
            const sorted = this.sortMessages(data);
            this.messagesSubject.next(sorted);
          }
          // Handle single message (standard or partial)
          else if (data.content && (data.senderId !== undefined)) {
            const fullMsg: Message = {
              id: data.id || Date.now(),
              caseId: data.caseId || caseId, // Use closure caseId
              senderId: data.senderId,
              content: data.content,
              createdAt: data.createdAt || new Date().toISOString()
            };
            this.appendMessage(fullMsg);
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Message WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.connectedSubject.next(false);

        // Auto-reconnect if still same case
        if (this.currentCaseId === caseId) {
          this.reconnectInterval = setTimeout(() => {
            this.connect(caseId, userId);
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Failed to create message WebSocket:', error);
      this.connectedSubject.next(false);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    this.currentCaseId = undefined;
    this.connectedSubject.next(false);
    this.messagesSubject.next([]);
  }

  /**
   * Send message via HTTP + optimistic update
   */
  async sendMessage(caseId: number, senderId: number, content: string): Promise<void> {
    const url = `${this.configService.apiUrl}/messages/case/save`;
    const payload = { caseId, senderId, content };

    // ✅ OPTIMISTIC UPDATE - dodaj odmah u UI
    const optimisticMessage: Message = {
      id: Date.now(), // temporary ID
      caseId,
      senderId,
      content,
      createdAt: new Date().toISOString()
    };

    this.appendMessage(optimisticMessage);

    try {
      // Pošalji na backend
      const response = await this.http.post<Message>(url, payload).toPromise();

      // ✅ ZAMIJENI temporary poruku sa pravom (sa server ID-em)
      if (response) {
        this.replaceOptimisticMessage(optimisticMessage.id, response);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // ✅ UKLONI optimistic poruku ako je fail
      this.removeMessage(optimisticMessage.id);
      throw error;
    }
  }

  /**
   * Append single message to current list (no duplicates)
   */
  private appendMessage(message: Message) {
    const current = this.messagesSubject.value;

    // Check if message already exists
    if (current.find(m => m.id === message.id)) {
      return;
    }

    const updated = [...current, message];
    const sorted = this.sortMessages(updated);
    this.messagesSubject.next(sorted);
  }

  /**
   * Replace optimistic message with real one from server
   */
  private replaceOptimisticMessage(tempId: number, realMessage: Message) {
    const current = this.messagesSubject.value;
    const updated = current.map(m => m.id === tempId ? realMessage : m);

    // Remove duplicates (ako je server već poslao istu poruku preko WS-a)
    const unique = updated.filter((msg, idx, arr) =>
      arr.findIndex(m => m.id === msg.id) === idx
    );

    const sorted = this.sortMessages(unique);
    this.messagesSubject.next(sorted);
  }

  /**
   * Remove message (rollback failed send)
   */
  private removeMessage(messageId: number) {
    const current = this.messagesSubject.value;
    const filtered = current.filter(m => m.id !== messageId);
    this.messagesSubject.next(filtered);
  }

  /**
   * Fetch initial message history via HTTP
   */
  private fetchHistory(caseId: number) {
    const url = `${this.configService.getMsgUrl}/${caseId}`;
    this.http.get<Message[]>(url).subscribe({
      next: (msgs) => {
        // Only update if we are still looking at the same case
        if (this.currentCaseId === caseId && Array.isArray(msgs)) {
          const sorted = this.sortMessages(msgs);
          this.messagesSubject.next(sorted);
        }
      },
      error: (err) => console.error('Failed to fetch message history:', err)
    });
  }

  /**
   * Sort messages by createdAt ascending
   */
  private sortMessages(messages: Message[]): Message[] {
    return [...messages].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Get current messages synchronously
   */
  getMessagesSync(): Message[] {
    return this.messagesSubject.value;
  }
}