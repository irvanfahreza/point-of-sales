import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4 sm:p-6 max-w-4xl mx-auto">
  <div class="page-header"><h1 class="page-title">Laporan Harian</h1></div>
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
    <div *ngFor="let i of [1,2,3]" class="skeleton h-14 rounded-xl"></div>
  </div>

  <div *ngIf="!loading && data" class="space-y-4">
    <!-- Summary KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card text-center">
        <p class="text-gray-500 text-xs">Total Pendapatan</p>
        <p class="text-2xl font-bold text-indigo-700 mt-1">{{ formatRupiah(data.totalRevenue) }}</p>
      </div>
      <div class="card text-center">
        <p class="text-gray-500 text-xs">Total Transaksi</p>
        <p class="text-2xl font-bold text-emerald-700 mt-1">{{ data.totalTransactions }}</p>
      </div>
      <div class="card text-center">
        <p class="text-gray-500 text-xs">Rata-rata Per Transaksi</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatRupiah(data.avgTransaction) }}</p>
      </div>
    </div>

    <!-- Daily breakdown table -->
    <div class="table-wrapper">
      <table class="w-full">
        <thead class="table-head"><tr>
          <th class="th">Tanggal</th><th class="th">Transaksi</th><th class="th">Pendapatan</th>
        </tr></thead>
        <tbody class="divide-y divide-gray-100">
          <tr *ngFor="let row of data.dailyBreakdown" class="tr-hover">
            <td class="td text-gray-700">{{ row.date }}</td>
            <td class="td text-gray-600">{{ row.transactionCount }}</td>
            <td class="td font-semibold text-gray-900">{{ formatRupiah(row.revenue) }}</td>
          </tr>
          <tr *ngIf="!data.dailyBreakdown?.length"><td colspan="3" class="py-10 text-center text-gray-400">Tidak ada data</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
  `
})
export class DailyReportComponent implements OnInit {
  startDate = '';
  endDate = '';
  data: any = null;
  loading = false;

  constructor(private api: ApiService, private toast: ToastService) {
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    today.setDate(today.getDate() - 30);
    this.startDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params: any = { page: 0, size: 100 };
    if (this.startDate) params['startDate'] = this.startDate + 'T00:00:00';
    if (this.endDate) params['endDate'] = this.endDate + 'T23:59:59';

    this.api.get<any>('/transactions', params).subscribe({
      next: res => {
        const transactions = res.data?.content || [];
        const byDate: any = {};
        let total = 0;
        transactions.filter((t: any) => t.status === 'SELESAI').forEach((t: any) => {
          const d = t.transactionDate?.split('T')[0] || '';
          if (!byDate[d]) byDate[d] = { date: d, transactionCount: 0, revenue: 0 };
          byDate[d].transactionCount++;
          byDate[d].revenue += Number(t.grandTotal);
          total += Number(t.grandTotal);
        });
        const completed = transactions.filter((t: any) => t.status === 'SELESAI');
        this.data = {
          totalRevenue: total,
          totalTransactions: completed.length,
          avgTransaction: completed.length ? total / completed.length : 0,
          dailyBreakdown: Object.values(byDate).sort((a: any, b: any) => b.date.localeCompare(a.date))
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  formatRupiah(v: number = 0): string { return 'Rp ' + v.toLocaleString('id-ID'); }
}
