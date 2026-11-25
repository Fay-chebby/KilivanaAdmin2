
import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { SettingsService } from '../../services/settings.service';
import {
  AuditRow,
  PlatformSettingRequest,
} from '../../models/settings.model';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.scss',
})
export class NotificationSettings implements OnInit {
  private readonly service = inject(SettingsService);

  transactionFee = signal('3');
  inspectionFee = signal('50');
  payoutDelay = signal('3 business days');

  saving = signal(false);
  settingsLoading = signal(true);
  settingsError = signal<string | null>(null);
  success = signal<string | null>(null);

  // Keys must match the backend NotificationEvent enum.
  toggles = signal([
    {
      key: 'NEW_FARMER_REGISTRATION',
      label: 'New farmer registration',
      on: true,
    },
    {
      key: 'KYC_SUBMITTED',
      label: 'KYC submitted',
      on: true,
    },
    {
      key: 'DISPUTE_OPENED',
      label: 'Dispute opened',
      on: true,
    },
    {
      key: 'ORDER_PLACED',
      label: 'Order placed',
      on: false,
    },
    {
      key: 'PAYOUT_PROCESSED',
      label: 'Payout processed',
      on: true,
    },
  ]);

  audit = signal<AuditRow[]>([]);
  page = signal(0);
  totalPages = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSettings();
    this.loadAudit();
  }

  // GET saved platform settings
  loadSettings(): void {
    this.settingsLoading.set(true);
    this.settingsError.set(null);

    this.service.getSettings().subscribe({
      next: (settings) => {
        this.transactionFee.set(String(settings.transactionFee));
        this.inspectionFee.set(String(settings.inspectionFee));
        this.payoutDelay.set(
          `${settings.payoutDelayDays} business days`,
        );

        const preferences = settings.notificationPreferences ?? {};

        this.toggles.update((list) =>
          list.map((toggle) => ({
            ...toggle,
            on: preferences[toggle.key] ?? toggle.on,
          })),
        );

        this.settingsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load platform settings:', err);
        this.settingsError.set(
          err?.error?.message ?? 'Failed to load platform settings.',
        );
        this.settingsLoading.set(false);
      },
    });
  }

  // GET audit history
  loadAudit(page = 0): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getAuditLog(page).subscribe({
      next: (res) => {
        this.audit.set(res.rows);
        this.page.set(page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit log:', err);
        this.error.set('Failed to load audit log.');
        this.loading.set(false);
      },
    });
  }

  // Toggle a notification preference
  toggle(key: string): void {
    this.success.set(null);

    this.toggles.update((list) =>
      list.map((toggle) =>
        toggle.key === key
          ? { ...toggle, on: !toggle.on }
          : toggle,
      ),
    );
  }

  // Update fee inputs
  setFee(which: 'tx' | 'insp', e: Event): void {
    const value = (e.target as HTMLInputElement).value;

    if (which === 'tx') {
      this.transactionFee.set(value);
    } else {
      this.inspectionFee.set(value);
    }

    this.success.set(null);
  }

  // PUT updated settings
  save(): void {
    if (this.saving()) return;

    const transactionFee = Number(this.transactionFee());
    const inspectionFee = Number(this.inspectionFee());

    const payoutDelayDays = Number.parseInt(
      this.payoutDelay().split(' ')[0],
      10,
    );

    if (
      !Number.isFinite(transactionFee) ||
      transactionFee < 0 ||
      transactionFee > 100
    ) {
      this.settingsError.set(
        'Transaction fee must be between 0 and 100%.',
      );
      return;
    }

    if (!Number.isFinite(inspectionFee) || inspectionFee < 0) {
      this.settingsError.set(
        'Inspection fee cannot be negative.',
      );
      return;
    }

    if (
      !Number.isInteger(payoutDelayDays) ||
      payoutDelayDays < 0 ||
      payoutDelayDays > 365
    ) {
      this.settingsError.set(
        'Payout delay must be between 0 and 365 days.',
      );
      return;
    }

    const notificationPreferences: Record<string, boolean> = {};

    this.toggles().forEach((toggle) => {
      notificationPreferences[toggle.key] = toggle.on;
    });

    const payload: PlatformSettingRequest = {
      transactionFee,
      inspectionFee,
      payoutDelayDays,
      notificationPreferences,
    };

    this.saving.set(true);
    this.settingsError.set(null);
    this.success.set(null);

    this.service.updateSettings(payload).subscribe({
      next: (settings) => {
        this.transactionFee.set(String(settings.transactionFee));
        this.inspectionFee.set(String(settings.inspectionFee));
        this.payoutDelay.set(
          `${settings.payoutDelayDays} business days`,
        );

        const preferences = settings.notificationPreferences ?? {};

        this.toggles.update((list) =>
          list.map((toggle) => ({
            ...toggle,
            on: preferences[toggle.key] ?? toggle.on,
          })),
        );

        this.saving.set(false);
        this.success.set('Settings saved successfully.');

        // Refresh audit log to show the settings change.
        this.loadAudit();
      },
      error: (err) => {
        console.error('Failed to save platform settings:', err);
        this.saving.set(false);
        this.settingsError.set(
          err?.error?.message ?? 'Failed to save settings. Please try again.',
        );
      },
    });
  }
}
