import { Injectable, computed, inject, signal } from '@angular/core';
import { PayResult } from '../models/payment.model';
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

const STORE_KEY = 'kilivana.reconciliation.v1';

interface Stored {
  lines: StatementLine[];
  links: Record<string, string>;
  resolutions: Record<string, Resolution>;
}

/** Your API has no statement endpoints, so statement lines and notes are kept in this browser. */
function readStore(): Stored {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<Stored>;
      return {
        lines: Array.isArray(v.lines) ? v.lines : [],
        links: v.links ?? {},
        resolutions: v.resolutions ?? {},
      };
    }
  } catch {
    /* private window or blocked storage */
  }
  return { lines: [], links: {}, resolutions: {} };
}

@Injectable({ providedIn: 'root' })
export class ReconciliationService {
  private payments = inject(PaymentService);

  private stored = readStore();
  private _lines = signal<StatementLine[]>(this.stored.lines);
  private _links = signal<Record<string, string>>(this.stored.links);
  private _resolutions = signal<Record<string, Resolution>>(this.stored.resolutions);

  /** Our side of the books comes from the backend payments. */
  readonly loading = this.payments.loading;
  readonly error = this.payments.error;
  load() {
    return this.payments.load();
  }

  private save() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          lines: this._lines(),
          links: this._links(),
          resolutions: this._resolutions(),
        }),
      );
    } catch {
      /* storage unavailable: data lasts until the page closes */
    }
  }

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
    this.save();
    return { ok: true, message: 'Marked as resolved.' };
  }

  reopen(key: string): PayResult {
    if (!this.get(key)?.resolution) return fail('This item is not resolved.');
    this._resolutions.update((r) => {
      const next = { ...r };
      delete next[key];
      return next;
    });
    this.save();
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
    this.save();
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
    const start = this._lines().reduce(
      (m, l) => Math.max(m, Number(l.id.replace(/\D/g, '')) || 0),
      0,
    );
    const added = r.lines.map(
      (l, i): StatementLine => ({
        ...l,
        id: `STM-${String(start + i + 1).padStart(3, '0')}`,
        source: 'import',
      }),
    );
    this._lines.update((l) => [...l, ...added]);
    this.save();
    const parts = [`Imported ${added.length} line${added.length === 1 ? '' : 's'}.`];
    if (r.skipped) parts.push(`${r.skipped} already on file.`);
    if (r.errors.length) parts.push(`${r.errors.length} could not be read.`);
    return { ok: true, message: parts.join(' '), errors: r.errors };
  }
}

const fail = (message: string): PayResult => ({ ok: false, message });
