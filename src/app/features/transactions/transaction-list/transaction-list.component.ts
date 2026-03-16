import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Transaction } from '../../../core/models/models';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transaction-list.component.html'
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  loading = false;
  totalPages = 0; totalElements = 0; page = 0; size = 10;

  // Filters
  startDate = ''; endDate = '';
  paymentMethod = ''; status = '';

  // Detail modal
  showDetail = false;
  selectedTransaction: Transaction | null = null;
  loadingDetail = false;

  // Void modal
  showVoidModal = false;
  voidForm: FormGroup;
  voiding = false;

  constructor(private api: ApiService, private toast: ToastService, private fb: FormBuilder) {
    this.voidForm = this.fb.group({ reason: ['', [Validators.required, Validators.minLength(5)]] });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params: any = { page: this.page, size: this.size };
    if (this.startDate) params['startDate'] = this.startDate + 'T00:00:00';
    if (this.endDate) params['endDate'] = this.endDate + 'T23:59:59';
    if (this.paymentMethod) params['paymentMethod'] = this.paymentMethod;
    if (this.status) params['status'] = this.status;

    this.api.get<any>('/transactions', params).subscribe({
      next: res => {
        this.transactions = res.data?.content || [];
        this.totalPages = res.data?.totalPages || 0;
        this.totalElements = res.data?.totalElements || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openDetail(t: Transaction): void {
    this.selectedTransaction = t;
    this.showDetail = true;
  }

  openVoid(t: Transaction): void {
    this.selectedTransaction = t;
    this.voidForm.reset();
    this.showVoidModal = true;
  }

  submitVoid(): void {
    if (this.voidForm.invalid) { this.voidForm.markAllAsTouched(); return; }
    if (!this.selectedTransaction) return;
    this.voiding = true;
    this.api.post<any>(`/transactions/${this.selectedTransaction.id}/void`, this.voidForm.value).subscribe({
      next: res => {
        this.toast.success('Transaksi berhasil dibatalkan');
        this.showVoidModal = false;
        this.voiding = false;
        this.load();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Gagal membatalkan transaksi');
        this.voiding = false;
      }
    });
  }

  search(): void { this.page = 0; this.load(); }
  clearFilters(): void { this.startDate = ''; this.endDate = ''; this.paymentMethod = ''; this.status = ''; this.page = 0; this.load(); }
  goToPage(p: number): void { this.page = p; this.load(); }

  formatRupiah(v: number = 0): string { return 'Rp ' + v.toLocaleString('id-ID'); }
  paymentLabel(m: string): string {
    const map: any = { TUNAI: 'Tunai', QRIS: 'QRIS', DEBIT: 'Debit', KARTU_KREDIT: 'Kartu Kredit' };
    return map[m] || m;
  }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }
  get voidReason() { return this.voidForm.get('reason'); }
}
