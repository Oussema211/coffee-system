import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../../core/category.service';
import { TranslationService } from '../../../core/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, LoadingComponent],
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
    private categoryService: CategoryService,
    private translate: TranslationService
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
        this.errorMessage = this.translate.translate('admin.categories.loadError');
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
          this.showSuccess(this.translate.translate('admin.categories.updateSuccess', { name: updated.name }));
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err.error?.error || this.translate.translate('admin.categories.updateError');
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
          this.showSuccess(this.translate.translate('admin.categories.createSuccess', { name: created.name }));
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err.error?.error || this.translate.translate('admin.categories.createError');
          this.errorMessage = msg;
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (!confirm(this.translate.translate('admin.categories.deleteConfirmNamed', { name: category.name }))) return;

    this.isDeleting = category.id;
    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== category.id);
        this.isDeleting = null;
        this.showSuccess(this.translate.translate('admin.categories.deleteSuccess', { name: category.name }));
      },
      error: (err) => {
        const msg = err.error?.error || this.translate.translate('admin.categories.deleteError');
        this.errorMessage = msg;
        this.isDeleting = null;
      }
    });
  }
}
