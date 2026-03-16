import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreSetting } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  form: FormGroup;
  settings: StoreSetting | null = null;
  loading = false;
  saving = false;
  uploadingLogo = false;
  apiBase = environment.apiUrl;

  constructor(private api: ApiService, private toast: ToastService, private fb: FormBuilder) {
    this.form = this.fb.group({
      storeName: ['', [Validators.required, Validators.maxLength(200)]],
      address: [''],
      phone: [''],
      taxRate: [11, [Validators.required, Validators.min(0), Validators.max(100)]],
      lowStockThreshold: [10, [Validators.required, Validators.min(0)]],
      receiptFooter: [''],
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any>('/settings').subscribe({
      next: res => {
        this.settings = res.data;
        this.form.patchValue(res.data);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.api.put<any>('/settings', this.form.value).subscribe({
      next: res => {
        this.toast.success(res.message || 'Pengaturan disimpan');
        this.settings = res.data;
        this.saving = false;
      },
      error: err => { this.toast.error(err.error?.message || 'Gagal menyimpan'); this.saving = false; }
    });
  }

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.toast.error('File harus berupa gambar'); return; }
    if (file.size > 2 * 1024 * 1024) { this.toast.error('Ukuran file maksimal 2MB'); return; }
    this.uploadingLogo = true;
    const form = new FormData();
    form.append('file', file);
    this.api.postForm<any>('/settings/logo', form).subscribe({
      next: res => {
        this.settings = res.data;
        this.toast.success('Logo berhasil diunggah');
        this.uploadingLogo = false;
      },
      error: () => { this.toast.error('Gagal mengunggah logo'); this.uploadingLogo = false; }
    });
  }

  get f() { return this.form.controls; }
  get logoUrl(): string | null { return this.settings?.logoPath ? this.apiBase + this.settings.logoPath : null; }
}
