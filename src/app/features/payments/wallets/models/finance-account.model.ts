export interface FinancialAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  description?: string;
  lastUpdated?: string;
}

/** The seven accounts the platform expects. Used for labels only. Balances always come from the backend. */
export const EXPECTED_ACCOUNTS: { name: string; purpose: string }[] = [
  { name: 'Payment Clearing', purpose: 'Buyer payments awaiting settlement' },
  { name: 'Settled Funds', purpose: 'Funds confirmed as settled' },
  { name: 'Seller Payables', purpose: 'Money owed to farmers and suppliers' },
  { name: 'Platform Commission Revenue', purpose: "Kilivana's earned commissions" },
  { name: 'Payment Processing Expenses', purpose: 'Payment provider fees' },
  { name: 'Refund Payables', purpose: 'Amounts owed to buyers for refunds' },
  { name: 'Payout Clearing', purpose: 'Funds being processed for seller payouts' },
];
