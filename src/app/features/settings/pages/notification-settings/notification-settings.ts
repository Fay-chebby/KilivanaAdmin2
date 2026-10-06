import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { AuditRow } from '../../models/settings.model';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.scss',
})
export class NotificationSettings implements OnInit {
  private service = inject(SettingsService);

  // Local only: the backend has no settings endpoint yet
  transactionFee = signal('3');
  inspectionFee = signal('50');
  payoutDelay = '3 business days';
  toggles = signal([
    { key: 'farmer', label: 'New farmer registration', on: true },
    { key: 'kyc', label: 'KYC submitted', on: true },
    { key: 'dispute', label: 'Dispute opened', on: true },
    { key: 'order', label: 'Order placed', on: false },
    { key: 'payout', label: 'Payout processed', on: true },
  ]);

  audit = signal<AuditRow[]>([]);
  page = signal(0);
  totalPages = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadAudit();
  }

  loadAudit(page = 0) {
    this.loading.set(true);
    this.error.set(null);
    this.service.getAuditLog(page).subscribe({
      next: (res) => {
        this.audit.set(res.rows);
        this.page.set(page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load audit log.');
        this.loading.set(false);
      },
    });
  }

  toggle(key: string) {
    this.toggles.update((list) => list.map((t) => (t.key === key ? { ...t, on: !t.on } : t)));
  }

  setFee(which: 'tx' | 'insp', e: Event) {
    const v = (e.target as HTMLInputElement).value;
    (which === 'tx' ? this.transactionFee : this.inspectionFee).set(v);
  }

  save() {
    // TODO: call PUT /admin/settings once the backend adds it
    alert('Settings are not saved yet: the backend has no settings endpoint.');
  }
}
