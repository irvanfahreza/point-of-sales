import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardData } from '../../core/models/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') chartRef!: ElementRef;

  data: DashboardData | null = null;
  loading = true;
  chart: Chart | null = null;
  chartDays: 7 | 30 = 7;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {}

  loadDashboard(): void {
    this.loading = true;
    this.api.get<any>('/dashboard').subscribe({
      next: (res) => {
        this.data = res.data;
        this.loading = false;
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => { this.loading = false; }
    });
  }

  renderChart(): void {
    if (!this.chartRef || !this.data) return;
    const chartData = this.chartDays === 7 ? this.data.revenueChart7Days : this.data.revenueChart30Days;
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.date),
        datasets: [{
          label: 'Pendapatan',
          data: chartData.map(d => d.revenue),
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          borderColor: '#6366f1',
          borderWidth: 2,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: (ctx) => `Rp ${Number(ctx.raw).toLocaleString('id-ID')}` }
        }},
        scales: { y: {
          ticks: { callback: (v) => 'Rp ' + Number(v).toLocaleString('id-ID') },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }, x: { grid: { display: false } } }
      }
    });
  }

  switchChart(days: 7 | 30): void {
    this.chartDays = days;
    this.renderChart();
  }

  formatRupiah(value: number): string {
    if (!value) return 'Rp 0';
    return 'Rp ' + value.toLocaleString('id-ID');
  }
}
