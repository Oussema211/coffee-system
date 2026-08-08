import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService, TableItem } from '../../../core/table.service';

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tables.html',
  styleUrl: './admin-tables.css'
})
export class AdminTablesComponent implements OnInit {

  tables: TableItem[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';

  // Add form
  newNumber: number | null = null;
  newSeats: number | null = null;
  addLoading = false;
  addError = '';

  // Delete confirm
  confirmDeleteId: number | null = null;

  constructor(private tableService: TableService) {}

  ngOnInit(): void {
    this.loadTables();
  }

  loadTables(): void {
    this.loading = true;
    this.errorMsg = '';
    this.tableService.getAdminTables().subscribe({
      next: (data) => {
        this.tables = data;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load tables. Is the backend running?';
        this.loading = false;
      }
    });
  }

  addTable(): void {
    if (!this.newNumber || !this.newSeats) {
      this.addError = 'Both table number and seat count are required.';
      return;
    }
    this.addLoading = true;
    this.addError = '';
    this.tableService.createTable({ number: this.newNumber, seats: this.newSeats }).subscribe({
      next: (created) => {
        this.tables = [...this.tables, created].sort((a, b) => a.number - b.number);
        this.newNumber = null;
        this.newSeats = null;
        this.addLoading = false;
        this.flash(`Table ${created.number} added successfully.`);
      },
      error: (err) => {
        this.addError = err?.error?.error ?? 'Failed to create table.';
        this.addLoading = false;
      }
    });
  }

  requestDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(): void {
    if (this.confirmDeleteId == null) return;
    const id = this.confirmDeleteId;
    const t = this.tables.find(x => x.id === id);
    this.tableService.deleteTable(id).subscribe({
      next: () => {
        this.tables = this.tables.filter(x => x.id !== id);
        this.confirmDeleteId = null;
        this.flash(`Table ${t?.number ?? ''} removed.`);
      },
      error: () => {
        this.confirmDeleteId = null;
        this.errorMsg = 'Failed to delete table.';
      }
    });
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = ''), 3500);
  }

  seatLabel(n: number): string {
    return n === 1 ? '1 seat' : `${n} seats`;
  }
}
