import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShiftReport, WorkerService } from '../../../core/worker.service';
import { TranslationService } from '../../../core/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-shift-reports',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LoadingComponent],
  templateUrl: './shift-reports.html'
})
export class ShiftReportsComponent implements OnInit {
  shifts: ShiftReport[] = [];
  loading = false;
  clearing = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private workerService: WorkerService,
    private translate: TranslationService
  ) {}

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
        this.errorMessage = this.translate.translate('admin.shiftReports.loadError');
        this.loading = false;
      }
    });
  }

  deleteOldShifts(): void {
    if (!confirm(this.translate.translate('admin.shiftReports.clearConfirm'))) return;

    this.clearing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.workerService.deleteShiftsOlderThanSevenDays().subscribe({
      next: ({ deletedCount }) => {
        this.successMessage = deletedCount === 1
          ? this.translate.translate('admin.shiftReports.clearSuccess', { count: deletedCount })
          : this.translate.translate('admin.shiftReports.clearSuccessPlural', { count: deletedCount });
        this.clearing = false;
        this.loadShifts();
      },
      error: () => {
        this.errorMessage = this.translate.translate('admin.shiftReports.clearError');
        this.clearing = false;
      }
    });
  }

  duration(shift: ShiftReport): string {
    if (!shift.checkOutAt) return this.translate.translate('admin.shiftReports.inProgress');
    const minutes = Math.max(0, Math.round((new Date(shift.checkOutAt).getTime() - new Date(shift.checkInAt).getTime()) / 60_000));
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }
}
