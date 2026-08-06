import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface Worker {
  id: number;
  name: string;
  username: string;
  status: 'Active' | 'Off shift';
  joined: string;
}

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './workers.html'
})
export class Workers {
  workers: Worker[] = [
    { id: 1, name: 'Sarah Miller', username: 'sarah.m', status: 'Active', joined: 'Jan 2026' },
    { id: 2, name: 'James Cooper', username: 'james.c', status: 'Off shift', joined: 'Mar 2026' },
    { id: 3, name: 'Alex Johnson', username: 'alex.j', status: 'Active', joined: 'May 2026' }
  ];

  showModal = false;
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  openAddModal(): void {
    this.form.reset();
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
    const value = this.form.value;
    this.workers.push({
      id: Math.max(0, ...this.workers.map(w => w.id)) + 1,
      name: value.name,
      username: value.username,
      status: 'Off shift',
      joined: 'Just now'
    });
    this.closeModal();
  }

  removeWorker(worker: Worker): void {
    this.workers = this.workers.filter(w => w.id !== worker.id);
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}