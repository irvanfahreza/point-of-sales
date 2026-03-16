import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, PageResponse } from '../../../core/models/models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './category-list.component.html'
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  saving = false;
  deleting = false;

  showForm = false;
  editingId: number | null = null;
  form: FormGroup;
  searchQuery = '';

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  showDeleteModal = false;
  categoryToDelete: Category | null = null;

  constructor(private api: ApiService, private toast: ToastService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      isActive: [true],
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params: any = { page: this.page, size: this.size };
    if (this.searchQuery) params['name'] = this.searchQuery;
    this.api.get<any>('/categories', params).subscribe({
      next: res => {
        this.categories = res.data?.content || [];
        this.totalPages = res.data?.totalPages || 0;
        this.totalElements = res.data?.totalElements || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.error('Gagal memuat kategori'); }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ isActive: true });
    this.showForm = true;
  }

  openEdit(cat: Category): void {
    this.editingId = cat.id;
    this.form.patchValue(cat);
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; this.form.reset(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.editingId
      ? this.api.put<any>(`/categories/${this.editingId}`, this.form.value)
      : this.api.post<any>('/categories', this.form.value);
    obs.subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Kategori disimpan');
        this.closeForm();
        this.saving = false;
        this.load();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menyimpan kategori');
        this.saving = false;
      }
    });
  }

  confirmDelete(cat: Category): void { this.categoryToDelete = cat; this.showDeleteModal = true; }

  deleteCategory(): void {
    if (!this.categoryToDelete) return;
    this.deleting = true;
    this.api.delete<any>(`/categories/${this.categoryToDelete.id}`).subscribe({
      next: () => {
        this.toast.success('Kategori berhasil dihapus');
        this.showDeleteModal = false;
        this.categoryToDelete = null;
        this.deleting = false;
        this.load();
      },
      error: (err) => { this.toast.error(err.error?.message || 'Gagal menghapus kategori'); this.deleting = false; }
    });
  }

  search(): void { this.page = 0; this.load(); }
  goToPage(p: number): void { this.page = p; this.load(); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get f() { return this.form.controls; }
}
