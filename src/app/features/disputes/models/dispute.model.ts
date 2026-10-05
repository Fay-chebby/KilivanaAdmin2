import { Tone } from '../../orders/models/order.model';

export type DisputeStatus = 'open' | 'in_review' | 'escalated' | 'resolved';
export type Outcome = 'refund_buyer' | 'pay_farmer' | 'partial_refund';
export type Category = 'not_received' | 'damaged' | 'quality' | 'quantity' | 'other';
export type SlaState = 'done' | 'ok' | 'soon' | 'overdue';

export const SLA_HOURS = 72;

export const STATUS_META: Record<DisputeStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'red' },
  in_review: { label: 'In Review', tone: 'amber' },
  escalated: { label: 'Escalated', tone: 'red' },
  resolved: { label: 'Resolved', tone: 'green' },
};

export const CATEGORY_LABEL: Record<Category, string> = {
  not_received: 'Not received',
  damaged: 'Damaged',
  quality: 'Quality',
  quantity: 'Quantity',
  other: 'Other',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  refund_buyer: 'Buyer refunded in full',
  pay_farmer: 'Farmer paid in full',
  partial_refund: 'Partial refund',
};

export interface DisputeNote {
  id: string;
  at: string;
  from: 'admin' | 'buyer' | 'farmer' | 'system';
  internal: boolean; // admin-only note
  to: 'buyer' | 'farmer' | null; // who an admin message is addressed to
  text: string;
}

export interface DisputeImage {
  id: string;
  url: string;
  caption: string;
  by: 'buyer' | 'farmer' | 'admin';
  at: string;
}

export interface Resolution {
  outcome: Outcome;
  refundKes: number;
  note: string;
  at: string;
  by: string;
}

export interface Dispute {
  id: string; // same as the order id
  code: string; // DSP-041
  orderId: string;
  orderCode: string;
  buyer: { name: string; phone: string; type: string };
  farmer: { name: string; phone: string };
  amountKes: number;
  issue: string;
  category: Category;
  status: DisputeStatus;
  openedAt: string;
  slaDeadline: string;
  reviewer: string | null;
  notes: DisputeNote[];
  evidence: DisputeImage[];
  resolution: Resolution | null;
}

const fmt = (ms: number) => {
  const h = Math.floor(Math.abs(ms) / 36e5);
  if (h < 1) return 'under 1 h';
  return h < 48 ? `${h} h` : `${Math.floor(h / 24)} d ${h % 24} h`;
};

/** How close a dispute is to missing its response deadline */
export function slaInfo(d: Dispute, nowMs: number): { state: SlaState; text: string } {
  if (d.status === 'resolved') return { state: 'done', text: 'Resolved' };
  const left = new Date(d.slaDeadline).getTime() - nowMs;
  if (left < 0) return { state: 'overdue', text: `${fmt(left)} overdue` };
  return { state: left <= 24 * 36e5 ? 'soon' : 'ok', text: `${fmt(left)} left` };
}

export function timeAgo(at: string, nowMs: number): string {
  const diff = nowMs - new Date(at).getTime();
  const h = Math.floor(diff / 36e5);
  if (diff < 6e4) return 'just now';
  if (h < 1) return `${Math.floor(diff / 6e4)} min ago`;
  if (h < 24) return `${h} h ago`;
  return at.slice(0, 10);
}

export const when = (at: string) => at.replace('T', ' ');
