import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentActionDialog } from '../../components/payment-action-dialog/payment-action-dialog';
import {
  PayResult,
  TXN_STATUS_LABEL,
  TXN_TYPE_LABEL,
  canSettle,
  kes,
} from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [DatePipe, RouterLink, PaymentActionDialog],
  templateUrl: './payment-details.html',
  styleUrl: './payment-details.scss',
})
export class PaymentDetails {
  private service = inject(PaymentService);

  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  readonly txn = computed(() => this.service.get(this.id));
  readonly typeLabel = TXN_TYPE_LABEL;
  readonly statusLabel = TXN_STATUS_LABEL;
  readonly kes = kes;
  readonly canSettle = canSettle;

  confirming = signal(false);
  result = signal<PayResult | null>(null);

  settle() {
    this.confirming.set(false);
    this.result.set(this.service.settle(this.id));
  }
}
