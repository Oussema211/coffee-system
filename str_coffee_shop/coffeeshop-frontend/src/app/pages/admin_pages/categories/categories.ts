import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../../core/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {
  categories: Category[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  isSaving = false;
  isDeleting: number | null = null;
  editingCategory: Category | null = null;

  form: FormGroup;

  get totalItems(): number {
    return this.categories.reduce((sum, c) => sum + (c.itemCount || 0), 0);
  }

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.errorMessage = 'Failed to load categories. Please ensure the backend is running.';
        this.isLoading = false;
      }
    });
  }

  openAddModal(): void {
    this.editingCategory = null;
    this.form.reset({ name: '', description: '' });
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategory = category;
    this.form.reset({ name: category.name, description: category.description || '' });
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
    this.errorMessage = '';
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }

  saveCategory(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    this.isSaving = true;

    if (this.editingCategory) {
      this.categoryService.updateCategory(this.editingCategory.id, value).subscribe({
        next: (updated) => {
          const idx = this.categories.findIndex(c => c.id === updated.id);
          if (idx !== -1) this.categories[idx] = updated;
          this.isSaving = false;
          this.closeModal();
          this.showSuccess(`"${updated.name}" updated successfully.`);
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err.error?.error || 'Failed to update category.';
          this.errorMessage = msg;
        }
      });
    } else {
      this.categoryService.createCategory(value).subscribe({
        next: (created) => {
          this.categories.push(created);
          this.categories.sort((a, b) => a.name.localeCompare(b.name));
          this.isSaving = false;
          this.closeModal();
          this.showSuccess(`"${created.name}" added successfully.`);
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err.error?.error || 'Failed to create category.';
          this.errorMessage = msg;
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Delete category "${category.name}"? This will not delete existing menu items using this category.`)) return;

    this.isDeleting = category.id;
    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== category.id);
        this.isDeleting = null;
        this.showSuccess(`"${category.name}" deleted successfully.`);
      },
      error: (err) => {
        const msg = err.error?.error || 'Failed to delete category.';
        this.errorMessage = msg;
        this.isDeleting = null;
      }
    });
  }
}
