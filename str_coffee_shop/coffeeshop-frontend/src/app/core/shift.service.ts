import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ShiftStatus {
  checkedIn: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly baseUrl = 'http://localhost:8080/api/worker/shift';

  constructor(private http: HttpClient) {}

  getCurrent(): Observable<ShiftStatus> {
    return this.http.get<ShiftStatus>(this.baseUrl);
  }

  checkIn(): Observable<ShiftStatus> {
    return this.http.post<ShiftStatus>(`${this.baseUrl}/check-in`, {});
  }

  checkOut(): Observable<ShiftStatus> {
    return this.http.post<ShiftStatus>(`${this.baseUrl}/check-out`, {});
  }
}
