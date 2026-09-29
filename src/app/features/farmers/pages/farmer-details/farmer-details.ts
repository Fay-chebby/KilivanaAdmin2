import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { FarmerService } from '../../services/farmer.service';
import { FarmerBadge } from '../../components/farmer-badge/Farmer badge ';
import { FarmCard } from '../../components/farm-card/farm-card';
import { FarmerActionDialog } from '../../components/farmer-action-dialog/farmer-action-dialog';
import {
  FarmerAction,
  KYC_LABEL,
  ORDER_STATUS_LABEL,
  STATUS_LABEL,
  avatarColor,
  initials,
  kycTone,
  orderTone,
  statusTone,
} from '../../models/farmer.model';

type Tab = 'overview' | 'farms' | 'orders' | 'documents';

@Component({
  selector: 'app-farmer-details',
  imports: [
    RouterLink,
    DecimalPipe,
    DatePipe,
    NgTemplateOutlet,
    FarmerBadge,
    FarmCard,
    FarmerActionDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './farmer-details.html',
  styleUrl: './farmer-details.scss',
})
export class FarmerDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(FarmerService);

  readonly statusLabel = STATUS_LABEL;
  readonly kycLabel = KYC_LABEL;
  readonly orderLabel = ORDER_STATUS_LABEL;
  readonly statusTone = statusTone;
  readonly kycTone = kycTone;
  readonly orderTone = orderTone;
  readonly initials = initials;
  readonly avatarColor = avatarColor;

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'farms', label: 'Farms' },
    { id: 'orders', label: 'Orders' },
    { id: 'documents', label: 'Documents' },
  ];
  readonly tab = signal<Tab>('overview');
  readonly dialog = signal<FarmerAction | null>(null);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });
  readonly farmer = computed(() => this.service.getDetail(this.id()));

  confirm(reason: string) {
    const action = this.dialog();
    const f = this.farmer();
    if (!action || !f) return;
    switch (action) {
      case 'approve':
        this.service.approve(f.id);
        break;
      case 'reject':
        this.service.reject(f.id, reason);
        break;
      case 'suspend':
        this.service.suspend(f.id, reason);
        break;
      case 'reinstate':
        this.service.reinstate(f.id);
        break;
    }
    this.dialog.set(null);
  }
}
