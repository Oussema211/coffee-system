import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LoadingComponent } from '../loading/loading';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [TranslatePipe, LoadingComponent],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialogComponent {
  @Input() titleKey = 'common.confirm';
  @Input() messageKey = '';
  @Input() confirmKey = 'common.confirm';
  @Input() cancelKey = 'common.cancel';
  @Input() loading = false;
  @Input() danger = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  confirm(): void {
    if (this.loading) return;
    this.confirmed.emit();
  }

  cancel(): void {
    if (this.loading) return;
    this.cancelled.emit();
  }
}
