import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  toasts = this.toasts$.asObservable();

  show(type: Toast['type'], message: string, duration = 3500): void {
    const id = Math.random().toString(36).substring(2);
    const toast: Toast = { id, type, message };
    this.toasts$.next([...this.toasts$.value, toast]);
    setTimeout(() => this.remove(id), duration);
  }

  success(message: string) { this.show('success', message); }
  error(message: string) { this.show('error', message, 5000); }
  warning(message: string) { this.show('warning', message); }
  info(message: string) { this.show('info', message); }

  remove(id: string): void {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
