import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-product-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4 sm:p-6 max-w-4xl mx-auto">
  <div class="page-header"><h1 class="page-title">Laporan Produk Terjual</h1></div>
  <div class="card mb-5 flex gap-3 flex-wrap">
    <div>
      <label class="form-label text-xs">Dari Tanggal</label>
      <input type="date" [(ngModel)]="startDate" class="form-input text-sm py-2.5"/>
    </div>
    <div>
      <label class="form-label text-xs">Sampai Tanggal</label>
      <input type="date" [(ngModel)]="endDate" class="form-input text-sm py-2.5"/>
    </div>
    <div class="flex items-end">
      <button (click)="load()" class="btn-primary px-5 py-2.5 text-sm">Filter</button>
    </div>
  </div>
  <div *ngIf="loading" class="space-y-3">
    <div *ngFor="let i of [1,2,3,4,5]" class="skeleton h-12 rounded-xl"></div>
  </div>
  <div *ngIf="!loading" class="table-wrapper">
    <table class="w-full">
      <thead class="table-head"><tr>
        <th class="th">#</th><th class="th">Produk</th><th class="th">Qty Terjual</th><th class="th">Total Pendapatan</th>
      </tr></thead>
      <tbody class="divide-y divide-gray-100">
        <tr *ngFor="let p of products; let i = index" class="tr-hover">
          <td class="td text-gray-400 text-xs">{{ i+1 }}</td>
          <td class="td font-medium text-gray-900">{{ p.productName }}</td>
          <td class="td text-gray-700">{{ p.totalQuantity }}</td>
          <td class="td font-semibold text-indigo-700">{{ formatRupiah(p.totalRevenue) }}</td>
        </tr>
        <tr *ngIf="products.length===0"><td colspan="4" class="py-10 text-center text-gray-400">Tidak ada data</td></tr>
      </tbody>
    </table>
  </div>
</div>
  `
})
export class ProductReportComponent implements OnInit {
  startDate = '';
  endDate = '';
  products: any[] = [];
  loading = false;

  constructor(private api: ApiService) {
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    today.setDate(today.getDate() - 30);
    this.startDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params: any = { page: 0, size: 500 };
    if (this.startDate) params['startDate'] = this.startDate + 'T00:00:00';
    if (this.endDate) params['endDate'] = this.endDate + 'T23:59:59';
    params['status'] = 'SELESAI';

    this.api.get<any>('/transactions', params).subscribe({
      next: res => {
        const transactions = res.data?.content || [];
        const byProduct: any = {};
        transactions.forEach((t: any) => {
          (t.items || []).forEach((item: any) => {
            const key = item.productName;
            if (!byProduct[key]) byProduct[key] = { productName: key, totalQuantity: 0, totalRevenue: 0 };
            byProduct[key].totalQuantity += item.quantity;
            byProduct[key].totalRevenue += Number(item.subtotal);
          });
        });
        this.products = Object.values(byProduct).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  formatRupiah(v: number = 0): string { return 'Rp ' + v.toLocaleString('id-ID'); }
}
