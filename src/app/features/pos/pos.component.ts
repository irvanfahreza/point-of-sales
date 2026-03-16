import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Discount, CartItem, StoreSetting } from '../../core/models/models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos.component.html'
})
export class PosComponent implements OnInit {
  // Product search
  searchQuery = '';
  searchResults: Product[] = [];
  searching = false;

  // Cart
  cart: CartItem[] = [];

  // Discounts
  activeDiscounts: Discount[] = [];
  selectedDiscountId: string = '';
  manualDiscountType: 'PERSENTASE' | 'NOMINAL' = 'PERSENTASE';
  manualDiscountValue: number = 0;
  useManualDiscount = false;

  // Payment
  paymentMethod: 'TUNAI' | 'QRIS' | 'DEBIT' | 'KARTU_KREDIT' = 'TUNAI';
  amountPaid: number = 0;
  customerName: string = '';

  // Settings
  settings: StoreSetting | null = null;

  // State
  processing = false;
  mobileTab: 'produk' | 'keranjang' = 'produk';
  showSuccessModal = false;
  lastTransaction: any = null;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadDiscounts();
    this.loadSettings();
    this.searchProducts();
  }

  loadSettings(): void {
    this.api.get<any>('/settings').subscribe({ next: res => this.settings = res.data });
  }

  loadDiscounts(): void {
    this.api.get<any>('/discounts/active').subscribe({ next: res => this.activeDiscounts = res.data || [] });
  }

  searchProducts(): void {
    this.searching = true;
    const q = this.searchQuery || ' ';
    this.api.get<any>('/products/search', { q }).subscribe({
      next: res => { this.searchResults = res.data || []; this.searching = false; },
      error: () => { this.searching = false; }
    });
  }

  addToCart(product: Product): void {
    const existing = this.cart.find(c => c.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
      } else {
        this.toast.warning(`Stok ${product.name} hanya tersisa ${product.stock}`);
      }
    } else {
      this.cart.push({ product, quantity: 1 });
    }
  }

  removeFromCart(index: number): void { this.cart.splice(index, 1); }

  updateQty(index: number, qty: number): void {
    if (qty <= 0) { this.removeFromCart(index); return; }
    if (qty > this.cart[index].product.stock) {
      this.toast.warning('Jumlah melebihi stok tersedia');
      return;
    }
    this.cart[index].quantity = qty;
  }

  get subtotal(): number { return this.cart.reduce((sum, c) => sum + c.product.sellingPrice * c.quantity, 0); }

  get discountAmount(): number {
    let type = this.manualDiscountType;
    let value = this.manualDiscountValue;
    if (!this.useManualDiscount && this.selectedDiscountId) {
      const d = this.activeDiscounts.find(d => d.id === +this.selectedDiscountId);
      if (d) { type = d.type; value = d.value; }
    }
    if (!value) return 0;
    if (type === 'PERSENTASE') return this.subtotal * value / 100;
    return Math.min(value, this.subtotal);
  }

  get taxRate(): number { return this.settings?.taxRate || 11; }
  get afterDiscount(): number { return this.subtotal - this.discountAmount; }
  get taxAmount(): number { return this.afterDiscount * this.taxRate / 100; }
  get grandTotal(): number { return this.afterDiscount + this.taxAmount; }
  get change(): number { return this.amountPaid - this.grandTotal; }

  clearCart(): void {
    this.cart = [];
    this.selectedDiscountId = '';
    this.manualDiscountValue = 0;
    this.useManualDiscount = false;
    this.amountPaid = 0;
    this.customerName = '';
    this.paymentMethod = 'TUNAI';
  }

  checkout(): void {
    if (this.cart.length === 0) { this.toast.warning('Keranjang kosong'); return; }
    if (this.paymentMethod === 'TUNAI' && this.amountPaid < this.grandTotal) {
      this.toast.warning('Jumlah bayar kurang dari total belanja'); return;
    }

    const selectedDiscount = this.selectedDiscountId && !this.useManualDiscount
      ? this.activeDiscounts.find(d => d.id === +this.selectedDiscountId) : null;

    const body: any = {
      customerName: this.customerName || null,
      paymentMethod: this.paymentMethod,
      amountPaid: this.paymentMethod === 'TUNAI' ? this.amountPaid : this.grandTotal,
      items: this.cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
    };
    if (selectedDiscount) body.discountId = selectedDiscount.id;
    if (this.useManualDiscount && this.manualDiscountValue > 0) {
      body.discountType = this.manualDiscountType;
      body.discountValue = this.manualDiscountValue;
    }

    this.processing = true;
    this.api.post<any>('/transactions', body).subscribe({
      next: res => {
        this.lastTransaction = res.data;
        this.showSuccessModal = true;
        this.clearCart();
        this.processing = false;
        this.searchProducts();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Gagal memproses transaksi');
        this.processing = false;
      }
    });
  }

  closeSuccess(): void { this.showSuccessModal = false; this.lastTransaction = null; }

  formatRupiah(v: number = 0): string { return 'Rp ' + v.toLocaleString('id-ID'); }
}
