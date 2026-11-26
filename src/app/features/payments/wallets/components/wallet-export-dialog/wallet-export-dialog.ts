import { Component, input, output } from '@angular/core';
import { PaymentActionDialog } from '../../../components/payment-action-dialog/payment-action-dialog';

/** Confirms an export. The file is built by the backend, so it always matches the ledger. */
@Component({
  selector: 'app-wallet-export-dialog',
  standalone: true,
  imports: [PaymentActionDialog],
  templateUrl: './wallet-export-dialog.html',
  styleUrl: './wallet-export-dialog.scss',
})
export class WalletExportDialog {
  message = input('Download the records that match your current filters as a CSV file?');
  lines = input<string[]>([]);
  confirmed = output<void>();
  dismissed = output<void>();
}
