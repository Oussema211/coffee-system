import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: 'ADMIN' | 'WORKER';
  userId: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  /** Returns the storage currently holding the session (if any). */
  private get storage(): Storage {
    return localStorage.getItem('token')
      ? localStorage
      : sessionStorage;
  }

  /**
   * Login with optional "remember me".
   * - rememberMe = true  → localStorage  (persists after browser close)
   * - rememberMe = false → sessionStorage (cleared when tab/browser closes)
   */
  login(credentials: AuthRequest, rememberMe = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        const store = rememberMe ? localStorage : sessionStorage;
        // Clear both storages to avoid stale data from a previous session type
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('role');

        store.setItem('token', response.token);
        store.setItem('username', response.username);
        store.setItem('role', response.role);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
  }

  getToken(): string | null {
    return localStorage.getItem('token') ?? sessionStorage.getItem('token');
  }

  getRole(): string | null {
    return this.storage.getItem('role');
  }

  getUsername(): string | null {
    return this.storage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}