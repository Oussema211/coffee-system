import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MenuService, MenuItem } from '../../../core/menu.service';
import { CategoryService } from '../../../core/category.service';
import { TranslationService } from '../../../core/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LoadingComponent } from '../../../core/components/loading/loading';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe, LoadingComponent],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu implements OnInit {
  items: MenuItem[] = [];
  // Filter tabs: 'All' + names from backend
  categories: string[] = ['All'];
  // Form dropdown: only the real category names (no 'All')
  formCategories: string[] = [];
  
  selectedCategory: string = 'All';
  searchQuery: string = '';
  
  isLoading: boolean = false;
  errorMessage: string = '';
  showModal: boolean = false;
  isSaving: boolean = false;
  deletingId: number | null = null;
  editingItem: MenuItem | null = null;
  form: FormGroup;

  // File upload & preview state
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private menuService: MenuService,
    private categoryService: CategoryService,
    private translate: TranslationService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      vatRate: [19],
      imageUrl: [''],
      hasSizes: [false],
      hasSugar: [false],
      sizes: this.fb.array([])
    });
  }

  get sizesForm(): FormArray {
    return this.form.get('sizes') as FormArray;
  }

  sizeFormGroup(index: number): FormGroup {
    return this.sizesForm.at(index) as FormGroup;
  }

  addSizeRow(name: string = '', priceDelta: number = 0): void {
    this.sizesForm.push(this.fb.group({
      name: [name, Validators.required],
      priceDelta: [priceDelta, [Validators.min(0)]]
    }));
  }

  removeSizeRow(index: number): void {
    this.sizesForm.removeAt(index);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadMenuItems();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.formCategories = cats.map(c => c.name);
        this.categories = ['All', ...this.formCategories];
        // Set form default to the first category if available
        if (this.formCategories.length > 0) {
          this.form.patchValue({ category: this.formCategories[0] });
        }
      },
      error: () => {
        // Fallback if categories API fails
        this.formCategories = ['Coffee', 'Pastry', 'Cold Drinks', 'Tea'];
        this.categories = ['All', ...this.formCategories];
        this.form.patchValue({ category: this.formCategories[0] });
      }
    });
  }

  loadMenuItems(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.menuService.getMenuItems().subscribe({
      next: (data) => {
        this.items = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load menu items:', err);
        this.errorMessage = this.translate.translate('admin.menu.loadError');
        this.isLoading = false;
      }
    });
  }

  get filteredItems(): MenuItem[] {
    return this.items.filter(item => {
      const matchesCategory = this.selectedCategory === 'All' || item.category.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesSearch = !this.searchQuery || item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || item.category.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  onImageError(item: MenuItem): void {
    item.imageUrl = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value && !this.selectedFile) {
      this.imagePreviewUrl = input.value;
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.form.patchValue({ imageUrl: '' });
  }

  openAddModal(): void {
    this.editingItem = null;
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.sizesForm.clear();
    this.form.reset({
      name: '',
      category: this.formCategories[0] || '',
      price: 0,
      vatRate: 19,
      imageUrl: '',
      hasSizes: false,
      hasSugar: false,
      sizes: []
    });
    this.showModal = true;
  }

  openEditModal(item: MenuItem): void {
    this.editingItem = item;
    this.selectedFile = null;
    this.imagePreviewUrl = item.imageUrl || null;
    this.sizesForm.clear();
    this.form.reset({
      name: item.name,
      category: item.category,
      price: item.price,
      vatRate: item.vatRate ?? 19,
      imageUrl: item.imageUrl || '',
      hasSizes: !!item.hasSizes,
      hasSugar: !!item.hasSugar,
      sizes: []
    });
    (item.sizes ?? []).forEach(size => this.addSizeRow(size.name, size.priceDelta));
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  saveItem(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    if (this.selectedFile) {
      // Upload picture first, then save item with uploaded image URL
      this.menuService.uploadImage(this.selectedFile).subscribe({
        next: (res) => {
          this.executeSave(res.imageUrl);
        },
        error: (err) => {
          console.error('Failed to upload image:', err);
          this.isSaving = false;
          alert(this.translate.translate('admin.menu.uploadError'));
        }
      });
    } else {
      const finalUrl = this.form.value.imageUrl || this.imagePreviewUrl || '';
      this.executeSave(finalUrl);
    }
  }

  private executeSave(imageUrl: string): void {
    const formValue = this.form.value;
    const sizes = formValue.hasSizes
      ? (formValue.sizes ?? []).filter((s: any) => s?.name?.trim()).map((s: any) => ({ name: s.name.trim(), priceDelta: Number(s.priceDelta) || 0 }))
      : [];

    const value = {
      ...formValue,
      imageUrl: imageUrl || '',
      sizes
    };

    if (this.editingItem) {
      this.menuService.updateMenuItem(this.editingItem.id, value).subscribe({
        next: (updatedItem) => {
          const index = this.items.findIndex(i => i.id === updatedItem.id);
          if (index !== -1) {
            this.items[index] = updatedItem;
          }
          this.isSaving = false;
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update menu item:', err);
          this.isSaving = false;
          alert(this.translate.translate('admin.menu.updateError'));
        }
      });
    } else {
      this.menuService.createMenuItem(value).subscribe({
        next: (newItem) => {
          this.items.push(newItem);
          this.isSaving = false;
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to create menu item:', err);
          this.isSaving = false;
          alert(this.translate.translate('admin.menu.createError'));
        }
      });
    }
  }

  deleteItem(item: MenuItem): void {
    if (confirm(this.translate.translate('admin.menu.deleteConfirmNamed', { name: item.name }))) {
      this.deletingId = item.id;
      this.menuService.deleteMenuItem(item.id).subscribe({
        next: () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.deletingId = null;
        },
        error: (err) => {
          this.deletingId = null;
          console.error('Failed to delete menu item:', err);
          alert(this.translate.translate('admin.menu.deleteError'));
        }
      });
    }
  }
}
