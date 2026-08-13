import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebSocketOrderEvent {
  type: 'NEW_QR_ORDER' | 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_CANCELLED' | 'ORDER_PAID';
  data?: any;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private orderEventsSubject = new Subject<WebSocketOrderEvent>();
  public orderEvents$: Observable<WebSocketOrderEvent> = this.orderEventsSubject.asObservable();
  private reconnectInterval = 3000;
  private isExplicitlyClosed = false;

  constructor(private ngZone: NgZone) {
    this.connect();
  }

  public connect(): void {
    this.isExplicitlyClosed = false;
    const wsUrl = this.getWebSocketUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected to', wsUrl);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketOrderEvent = JSON.parse(event.data);
          this.ngZone.run(() => {
            this.orderEventsSubject.next(message);
          });
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      this.socket.onerror = (error) => {
        console.warn('[WebSocket] Error:', error);
      };

      this.socket.onclose = () => {
        console.log('[WebSocket] Connection closed');
        if (!this.isExplicitlyClosed) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };
    } catch (e) {
      console.error('[WebSocket] Connection attempt failed:', e);
      if (!this.isExplicitlyClosed) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    }
  }

  private getWebSocketUrl(): string {
    let baseUrl = environment.apiUrl || 'http://localhost:8080';

    if (window?.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        baseUrl = `${protocol}//${window.location.hostname}:8080`;
      }
    }

    if (baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'ws://');
    } else if (baseUrl.startsWith('https://')) {
      baseUrl = baseUrl.replace('https://', 'wss://');
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      baseUrl = `${protocol}//${window.location.host}`;
    }
    return `${baseUrl}/ws/orders`;
  }

  public close(): void {
    this.isExplicitlyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
