import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  form: FormGroup;
  categories: Category[] = [];
  loading = false;
  saving = false;
  productId: number | null = null;
  isEdit = false;

  units = ['pcs', 'kg', 'gram', 'box', 'lusin', 'pack', 'botol', 'liter', 'ml', 'rim'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      sku: ['', Validators.maxLength(100)],
      categoryId: [null],
      description: [''],
      unit: ['pcs'],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: ['', [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [null],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'] ? Number(this.route.snapshot.params['id']) : null;
    this.isEdit = !!this.productId;
    this.loadCategories();
    if (this.isEdit) this.loadProduct();
  }

  loadCategories(): void {
    this.api.get<any>('/categories/active').subscribe({
      next: res => this.categories = res.data || []
    });
  }

  loadProduct(): void {
    this.loading = true;
    this.api.get<any>(`/products/${this.productId}`).subscribe({
      next: res => {
        const p = res.data;
        this.form.patchValue({ ...p, categoryId: p.categoryId });
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.error('Gagal memuat produk'); }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const obs = this.isEdit
      ? this.api.put<any>(`/products/${this.productId}`, this.form.value)
      : this.api.post<any>('/products', this.form.value);

    obs.subscribe({
      next: (res) => {
        this.toast.success(res.message || (this.isEdit ? 'Produk diperbarui' : 'Produk ditambahkan'));
        this.router.navigate(['/products']);
        this.saving = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menyimpan produk');
        this.saving = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
