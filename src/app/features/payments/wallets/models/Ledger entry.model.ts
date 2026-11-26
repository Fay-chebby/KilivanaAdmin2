export interface LedgerEntry {
  id: string;
  reference?: string;
  transactionReference: string;
  accountId?: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  currency: string;
  description?: string | null;
  orderReference?: string | null;
  sellerName?: string | null;
  createdAt: string;
  createdBy?: string | null;
  source?: string | null;
}
