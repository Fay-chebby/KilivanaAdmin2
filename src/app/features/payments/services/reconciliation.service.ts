import { Injectable, computed, inject, signal } from '@angular/core';
import { PayResult, payoutOf } from '../models/payment.model';
import {
  ImportResult,
  MAX_NOTE,
  MIN_NOTE,
  ReconItem,
  Resolution,
  StatementLine,
  parseStatementCsv,
  reconStats,
  reconcile,
} from '../models/reconciliation.model';
import { PaymentService } from './payment.service';

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const line = (
  n: number,
  provider: StatementLine['provider'],
  reference: string,
  amount: number,
  direction: StatementLine['direction'],
  days: number,
): StatementLine => ({
  id: `STM-${String(n).padStart(3, '0')}`,
  provider,
  reference,
  amount,
  direction,
  date: daysAgo(days),
  source: 'seed',
});

// Mock statement. Replace with a real import. It is built to show every state:
// STM-003 differs by KSh 500 (bank charge), STM-013 has no transaction, and TXN-9894 has no line.
const SEED_LINES: StatementLine[] = [
  line(1, 'M-Pesa', 'SJK4L2M9QX', 142_000, 'in', 0),
  line(2, 'M-Pesa', 'SJK4L1A7PD', 91_600, 'out', 0),
  line(3, 'Bank', 'KCB-88213307', 84_500, 'in', 0),
  line(4, 'M-Pesa', 'SJJ9T5N2WE', 26_880, 'out', 1),
  line(5, 'M-Pesa', 'SJI2B8C4RZ', 64_500, 'in', 2),
  line(6, 'M-Pesa', 'SJG7Q3V8LM', 4_800, 'out', 4),
  line(7, 'Bank', 'EQB-70419982', 203_000, 'in', 5),
  line(8, 'M-Pesa', 'SJF1X6D0KT', 38_400, 'in', 6),
  line(9, 'M-Pesa', 'SJF2Y9H3UC', payoutOf(38_400), 'out', 6),
  line(10, 'M-Pesa', 'SJD5M7P1AB', 71_300, 'in', 8),
  line(11, 'M-Pesa', 'SJD6N2R8GH', payoutOf(71_300), 'out', 8),
  line(12, 'Bank', 'NCBA-33920415', 56_000, 'in', 10),
  line(13, 'M-Pesa', 'SJL8Z4K1QW', 15_000, 'in', 3),
];

@Injectable({ providedIn: 'root' })
export class ReconciliationService {
  private payments = inject(PaymentService);

  private _lines = signal<StatementLine[]>(SEED_LINES);
  private _links = signal<Record<string, string>>({});
  private _resolutions = signal<Record<string, Resolution>>({});

  readonly lines = this._lines.asReadonly();
  readonly items = computed<ReconItem[]>(() =>
    reconcile(this.payments.transactions(), this._lines(), this._links(), this._resolutions()),
  );
  readonly stats = computed(() => reconStats(this.items()));

  get(key: string) {
    return this.items().find((i) => i.key === key);
  }

  /** Closes an item with a written explanation. Matched items need nothing. */
  resolve(key: string, note: string): PayResult {
    const item = this.get(key);
    if (!item) return fail('Item not found.');
    if (item.kind === 'matched')
      return fail('This item already matches. There is nothing to resolve.');
    if (item.resolution) return fail('This item is already resolved.');
    const text = note.trim();
    if (text.length < MIN_NOTE)
      return fail(`Write a note of at least ${MIN_NOTE} characters that explains the difference.`);
    if (text.length > MAX_NOTE) return fail(`Keep the note under ${MAX_NOTE} characters.`);
    this._resolutions.update((r) => ({
      ...r,
      [key]: { note: text, at: new Date().toISOString() },
    }));
    return { ok: true, message: 'Marked as resolved.' };
  }

  reopen(key: string): PayResult {
    if (!this.get(key)?.resolution) return fail('This item is not resolved.');
    this._resolutions.update((r) => {
      const next = { ...r };
      delete next[key];
      return next;
    });
    return { ok: true, message: 'Reopened for review.' };
  }

  /** Links an unrecognised statement line to a settled transaction that is missing from the statement. */
  link(lineKey: string, txnId: string): PayResult {
    const lineItem = this.get(lineKey);
    const txnItem = this.get(txnId);
    if (!lineItem || lineItem.kind !== 'unknown' || !lineItem.line)
      return fail('Pick an unrecognised statement line.');
    if (!txnItem || txnItem.kind !== 'missing')
      return fail('Pick a transaction that is not on the statement.');
    this._links.update((l) => ({ ...l, [lineItem.line!.id]: txnId }));
    return { ok: true, message: `Linked ${lineItem.line.reference} to ${txnId}.` };
  }

  /** Adds lines from a CSV statement. Lines whose reference is already on file are skipped. */
  importCsv(text: string): ImportResult {
    const known = new Set(this._lines().map((l) => l.reference.trim().toUpperCase()));
    const r = parseStatementCsv(text, known);
    if (r.fatal) return { ok: false, message: r.fatal, errors: [] };
    if (!r.lines.length) {
      const why = r.errors.length
        ? 'No lines could be read.'
        : r.skipped
          ? 'Every line was already imported.'
          : 'No lines found.';
      return { ok: false, message: why, errors: r.errors };
    }
    const start = this._lines().length;
    const added = r.lines.map(
      (l, i): StatementLine => ({
        ...l,
        id: `STM-${String(start + i + 1).padStart(3, '0')}`,
        source: 'import',
      }),
    );
    this._lines.update((l) => [...l, ...added]);
    const parts = [`Imported ${added.length} line${added.length === 1 ? '' : 's'}.`];
    if (r.skipped) parts.push(`${r.skipped} already on file.`);
    if (r.errors.length) parts.push(`${r.errors.length} could not be read.`);
    return { ok: true, message: parts.join(' '), errors: r.errors };
  }
}

const fail = (message: string): PayResult => ({ ok: false, message });
