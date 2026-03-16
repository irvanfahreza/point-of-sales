import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Discount } from '../../../core/models/models';

@Component({
  selector: 'app-discount-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './discount-list.component.html'
})
export class DiscountListComponent implements OnInit {
  discounts: Discount[] = [];
  loading = false;
  saving = false;
  deleting = false;
  showForm = false;
  editingId: number | null = null;
  showDeleteModal = false;
  discountToDelete: Discount | null = null;
  form: FormGroup;
  page = 0; size = 10; totalPages = 0; totalElements = 0;

  constructor(private api: ApiService, private toast: ToastService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      type: ['PERSENTASE', [Validators.required]],
      value: ['', [Validators.required, Validators.min(0.01)]],
      isActive: [true],
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any>('/discounts', { page: this.page, size: this.size }).subscribe({
      next: res => { this.discounts = res.data?.content || []; this.totalPages = res.data?.totalPages || 0; this.totalElements = res.data?.totalElements || 0; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCreate(): void { this.editingId = null; this.form.reset({ type: 'PERSENTASE', isActive: true }); this.showForm = true; }
  openEdit(d: Discount): void { this.editingId = d.id; this.form.patchValue(d); this.showForm = true; }
  closeForm(): void { this.showForm = false; }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.editingId ? this.api.put<any>(`/discounts/${this.editingId}`, this.form.value) : this.api.post<any>('/discounts', this.form.value);
    obs.subscribe({
      next: res => { this.toast.success(res.message || 'Diskon disimpan'); this.closeForm(); this.saving = false; this.load(); },
      error: err => { this.toast.error(err.error?.message || 'Gagal menyimpan'); this.saving = false; }
    });
  }

  confirmDelete(d: Discount): void { this.discountToDelete = d; this.showDeleteModal = true; }
  doDelete(): void {
    if (!this.discountToDelete) return;
    this.deleting = true;
    this.api.delete<any>(`/discounts/${this.discountToDelete.id}`).subscribe({
      next: () => { this.toast.success('Diskon berhasil dihapus'); this.showDeleteModal = false; this.discountToDelete = null; this.deleting = false; this.load(); },
      error: err => { this.toast.error(err.error?.message || 'Gagal menghapus'); this.deleting = false; }
    });
  }

  get f() { return this.form.controls; }
  formatRupiah(v: number) { return 'Rp ' + (v||0).toLocaleString('id-ID'); }
}
