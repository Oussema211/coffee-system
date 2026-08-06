import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkerService, WorkerModel } from '../../../core/worker.service';

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workers.html'
})
export class Workers implements OnInit {
  workers: WorkerModel[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  showModal = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private workerService: WorkerService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.workerService.getWorkers().subscribe({
      next: (data) => {
        this.workers = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load workers from server.';
        this.loading = false;
      }
    });
  }

  openAddModal(): void {
    this.form.reset();
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  addWorker(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.workerService.addWorker(this.form.value).subscribe({
      next: (createdWorker) => {
        this.workers.push(createdWorker);
        this.saving = false;
        this.closeModal();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Failed to create worker. Username may already exist.';
      }
    });
  }

  removeWorker(worker: WorkerModel): void {
    if (!confirm(`Are you sure you want to remove worker "${worker.name}"?`)) {
      return;
    }

    this.workerService.deleteWorker(worker.id).subscribe({
      next: () => {
        this.workers = this.workers.filter(w => w.id !== worker.id);
      },
      error: () => {
        alert('Failed to remove worker.');
      }
    });
  }

  initials(name: string): string {
    if (!name) return 'W';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}