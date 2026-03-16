import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, Category, PageResponse } from '../../../core/models/models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = false;
  deleting = false;

  // Filters
  searchQuery = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  
  // Pagination
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  // Delete modal
  showDeleteModal = false;
  productToDelete: Product | null = null;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.api.get<any>('/categories/active').subscribe({
      next: res => this.categories = res.data || []
    });
  }

  loadProducts(): void {
    this.loading = true;
    const params: any = { page: this.page, size: this.size };
    if (this.searchQuery) params['name'] = this.searchQuery;
    if (this.selectedCategory) params['categoryId'] = this.selectedCategory;
    if (this.selectedStatus !== '') params['isActive'] = this.selectedStatus;

    this.api.get<any>('/products', params).subscribe({
      next: res => {
        if (res.data) {
          this.products = res.data.content;
          this.totalPages = res.data.totalPages;
          this.totalElements = res.data.totalElements;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.error('Gagal memuat produk'); }
    });
  }

  search(): void { this.page = 0; this.loadProducts(); }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.page = 0;
    this.loadProducts();
  }

  goToPage(p: number): void { this.page = p; this.loadProducts(); }

  confirmDelete(product: Product): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  deleteProduct(): void {
    if (!this.productToDelete) return;
    this.deleting = true;
    this.api.delete<any>(`/products/${this.productToDelete.id}`).subscribe({
      next: () => {
        this.toast.success('Produk berhasil dihapus');
        this.showDeleteModal = false;
        this.productToDelete = null;
        this.deleting = false;
        this.loadProducts();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Gagal menghapus produk');
        this.deleting = false;
      }
    });
  }

  formatRupiah(value: number): string {
    return 'Rp ' + (value || 0).toLocaleString('id-ID');
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
}
