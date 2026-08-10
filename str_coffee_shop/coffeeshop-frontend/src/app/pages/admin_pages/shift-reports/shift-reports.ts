import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftReport, WorkerService } from '../../../core/worker.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-shift-reports',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './shift-reports.html'
})
export class ShiftReportsComponent implements OnInit {
  shifts: ShiftReport[] = [];
  loading = false;
  clearing = false;
  errorMessage = '';
  successMessage = '';

  constructor(private workerService: WorkerService) {}

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.workerService.getShiftReports().subscribe({
      next: (shifts) => {
        this.shifts = shifts;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load shift history.';
        this.loading = false;
      }
    });
  }

  deleteOldShifts(): void {
    if (!confirm('Delete shifts that started more than 7 days ago? This cannot be undone.')) return;

    this.clearing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.workerService.deleteShiftsOlderThanSevenDays().subscribe({
      next: ({ deletedCount }) => {
        this.successMessage = `${deletedCount} old shift${deletedCount === 1 ? '' : 's'} removed.`;
        this.clearing = false;
        this.loadShifts();
      },
      error: () => {
        this.errorMessage = 'Failed to remove old shifts.';
        this.clearing = false;
      }
    });
  }

  duration(shift: ShiftReport): string {
    if (!shift.checkOutAt) return 'In progress';
    const minutes = Math.max(0, Math.round((new Date(shift.checkOutAt).getTime() - new Date(shift.checkInAt).getTime()) / 60_000));
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
}
