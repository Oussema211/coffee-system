import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ShiftStatus {
  checkedIn: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly baseUrl = `${environment.apiUrl}/api/worker/shift`;
  private readonly shiftSubject = new BehaviorSubject<ShiftStatus>({
    checkedIn: false,
    checkInAt: null,
    checkOutAt: null
  });

  readonly shift$ = this.shiftSubject.asObservable();

  constructor(private http: HttpClient) {}

  get checkedIn(): boolean {
    return this.shiftSubject.value.checkedIn;
  }

  getCurrent(): Observable<ShiftStatus> {
    return this.http.get<ShiftStatus>(this.baseUrl);
  }

  refresh(): void {
    this.getCurrent().subscribe({
      next: (shift) => this.shiftSubject.next(shift),
      error: () => {}
    });
  }

  checkIn(): Observable<ShiftStatus> {
    return this.http.post<ShiftStatus>(`${this.baseUrl}/check-in`, {}).pipe(
      tap((shift) => this.shiftSubject.next(shift))
    );
  }

  checkOut(): Observable<ShiftStatus> {
    return this.http.post<ShiftStatus>(`${this.baseUrl}/check-out`, {}).pipe(
      tap((shift) => this.shiftSubject.next(shift))
    );
  }
}
