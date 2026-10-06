import { Transaction, TxnType, kes } from './payment.model';

export type StatementDirection = 'in' | 'out';
export type StatementProvider = 'M-Pesa' | 'Bank';
export type ReconKind = 'matched' | 'mismatch' | 'missing' | 'unknown';
export type ReconFilter = 'all' | 'review' | 'matched' | 'resolved';

/** One line from an M-Pesa or bank statement. Amounts are always positive. */
export interface StatementLine {
  id: string; // STM-001
  provider: StatementProvider;
  reference: string; // M-Pesa code or bank reference
  amount: number; // KSh
  direction: StatementDirection; // in = money received, out = money paid out
  date: string; // ISO date
  source: 'seed' | 'import';
}

export interface Resolution {
  note: string;
  at: string;
}

export interface ReconItem {
  key: string; // statement line id, or transaction id when the line is missing
  kind: ReconKind;
  txn?: Transaction;
  line?: StatementLine;
  expected: number | null; // what our records say
  actual: number | null; // what the statement says
  variance: number; // actual minus expected
  reason: string;
  date: string;
  resolution?: Resolution;
}

export interface ReconStats {
  total: number;
  matched: number;
  review: number;
  resolved: number;
  unreconciled: number; // KSh still unexplained
  reconciledRate: number; // % of items matched or resolved
}

export interface ImportResult {
  ok: boolean;
  message: string;
  errors: string[];
}

export const RECON_KIND_LABEL: Record<ReconKind, string> = {
  matched: 'Matched',
  mismatch: 'Amount differs',
  missing: 'Not on statement',
  unknown: 'Unrecognised',
};

export const RECON_FILTERS: { key: ReconFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'review', label: 'Needs review' },
  { key: 'matched', label: 'Matched' },
  { key: 'resolved', label: 'Resolved' },
];

export const MIN_NOTE = 10;
export const MAX_NOTE = 300;
export const MAX_CSV_BYTES = 2_000_000;
export const MAX_CSV_ROWS = 5_000;

const norm = (s: string) => s.trim().toUpperCase();
const round2 = (n: number) => Math.round(n * 100) / 100;
const EXPECTED_DIRECTION: Record<TxnType, StatementDirection> = {
  payment: 'in',
  payout: 'out',
  refund: 'out',
};

export const needsReview = (i: ReconItem) => i.kind !== 'matched' && !i.resolution;
export const isResolved = (i: ReconItem) => i.kind !== 'matched' && !!i.resolution;

export function signedKes(n: number): string {
  if (Math.abs(n) < 0.005) return kes(0);
  return `${n > 0 ? '+' : '-'}${kes(Math.abs(n))}`;
}

/**
 * Compares settled transactions with statement lines.
 * 1. A line matches the transaction with the same reference, or the one an admin linked it to.
 * 2. Same reference but a different amount or direction is a mismatch.
 * 3. A line with no transaction is unrecognised. A settled transaction with no line is missing.
 * Pending transactions are skipped, because no money has moved yet.
 */
export function reconcile(
  txns: Transaction[],
  lines: StatementLine[],
  links: Record<string, string>,
  resolutions: Record<string, Resolution>,
): ReconItem[] {
  const settled = txns.filter((t) => t.status === 'settled');
  const byRef = new Map<string, Transaction>();
  for (const t of settled) if (t.externalRef) byRef.set(norm(t.externalRef), t);
  const byId = new Map(settled.map((t) => [t.id, t] as const));
  const claimed = new Set<string>();
  const items: ReconItem[] = [];

  for (const l of lines) {
    const t = (links[l.id] ? byId.get(links[l.id]) : undefined) ?? byRef.get(norm(l.reference));

    if (t && claimed.has(t.id)) {
      items.push({
        key: l.id,
        kind: 'unknown',
        line: l,
        expected: null,
        actual: l.amount,
        variance: l.amount,
        reason: `This reference was already matched to ${t.id}. It may be a duplicate line.`,
        date: l.date,
      });
      continue;
    }
    if (!t) {
      items.push({
        key: l.id,
        kind: 'unknown',
        line: l,
        expected: null,
        actual: l.amount,
        variance: l.amount,
        reason: 'This line is on the statement, but no transaction has this reference.',
        date: l.date,
      });
      continue;
    }

    claimed.add(t.id);
    const variance = round2(l.amount - t.amount);
    const wrongWay = l.direction !== EXPECTED_DIRECTION[t.type];
    const problems: string[] = [];
    if (variance !== 0)
      problems.push(`The statement shows ${kes(l.amount)} but we recorded ${kes(t.amount)}.`);
    if (wrongWay)
      problems.push(
        `The statement shows money going ${l.direction}, but a ${t.type} should go ${EXPECTED_DIRECTION[t.type]}.`,
      );
    const reason = problems.length ? problems.join(' ') : 'Reference and amount match.';
    items.push({
      key: l.id,
      kind: variance !== 0 || wrongWay ? 'mismatch' : 'matched',
      txn: t,
      line: l,
      expected: t.amount,
      actual: l.amount,
      variance,
      reason,
      date: l.date,
    });
  }

  for (const t of settled) {
    if (claimed.has(t.id)) continue;
    items.push({
      key: t.id,
      kind: 'missing',
      txn: t,
      expected: t.amount,
      actual: null,
      variance: -t.amount,
      reason:
        'We recorded this as settled, but it is not on the statement. The provider may not have confirmed it yet.',
      date: t.settledAt ?? t.createdAt,
    });
  }

  for (const i of items) i.resolution = resolutions[i.key];
  return items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function reconStats(items: ReconItem[]): ReconStats {
  const matched = items.filter((i) => i.kind === 'matched').length;
  const review = items.filter(needsReview);
  const resolved = items.filter(isResolved).length;
  const total = items.length;
  return {
    total,
    matched,
    review: review.length,
    resolved,
    unreconciled: round2(review.reduce((s, i) => s + Math.abs(i.variance), 0)),
    reconciledRate: total ? Math.round(((matched + resolved) / total) * 100) : 100,
  };
}

// ---------------- CSV import ----------------

export type NewStatementLine = Omit<StatementLine, 'id' | 'source'>;
export interface CsvParseResult {
  lines: NewStatementLine[];
  errors: string[];
  skipped: number;
  fatal?: string;
}

/** Reads rows, handling quoted cells and "" escapes. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    cell = '';
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else cell += c;
  }
  endRow();
  return rows;
}

const COLUMN_NAMES: Record<string, string[]> = {
  date: ['date', 'completion time', 'transaction date'],
  reference: ['reference', 'ref', 'receipt', 'receipt no', 'receipt no.'],
  amount: ['amount'],
  direction: ['direction', 'type'],
};

const IN_WORDS = new Set(['in', 'credit', 'paid in', 'received']);
const OUT_WORDS = new Set(['out', 'debit', 'paid out', 'withdrawn']);

export const guessProvider = (ref: string): StatementProvider =>
  /^[A-Z0-9]{10}$/.test(norm(ref)) && /[A-Z]/.test(norm(ref)) && /\d/.test(norm(ref))
    ? 'M-Pesa'
    : 'Bank';

/**
 * Expected columns: date (yyyy-mm-dd), reference, amount, direction (in or out).
 * `knownRefs` holds references already on file, so re-importing the same statement adds nothing twice.
 */
export function parseStatementCsv(raw: string, knownRefs: Set<string>): CsvParseResult {
  const empty = (fatal: string): CsvParseResult => ({ lines: [], errors: [], skipped: 0, fatal });
  if (raw.length > MAX_CSV_BYTES)
    return empty('The file is too large. Split it into files under 2 MB.');

  const rows = parseCsvRows(raw.replace(/^﻿/, ''));
  if (rows.length < 2)
    return empty('The file has no data rows. Add a header row and at least one line.');
  if (rows.length - 1 > MAX_CSV_ROWS)
    return empty(`The file has more than ${MAX_CSV_ROWS} lines. Split it into smaller files.`);

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col: Record<string, number> = {};
  const missing: string[] = [];
  for (const [key, names] of Object.entries(COLUMN_NAMES)) {
    const idx = header.findIndex((h) => names.includes(h));
    if (idx < 0) missing.push(key);
    else col[key] = idx;
  }
  if (missing.length)
    return empty(
      `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Expected: date, reference, amount, direction.`,
    );

  const lines: NewStatementLine[] = [];
  const errors: string[] = [];
  const seen = new Set<string>(knownRefs);
  let skipped = 0;

  rows.slice(1).forEach((r, n) => {
    const at = `Row ${n + 2}`;
    const reference = (r[col['reference']] ?? '').trim();
    const dateText = (r[col['date']] ?? '').trim();
    const amount = Number((r[col['amount']] ?? '').replace(/[,\s]|ksh/gi, ''));
    const dir = (r[col['direction']] ?? '').trim().toLowerCase();

    if (!reference || reference.length > 40)
      return void errors.push(`${at}: the reference is empty or longer than 40 characters.`);
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateText) || Number.isNaN(Date.parse(dateText)))
      return void errors.push(`${at}: use the date format yyyy-mm-dd.`);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)
      return void errors.push(`${at}: the amount must be a positive number.`);
    const direction: StatementDirection | null = IN_WORDS.has(dir)
      ? 'in'
      : OUT_WORDS.has(dir)
        ? 'out'
        : null;
    if (!direction) return void errors.push(`${at}: direction must be "in" or "out".`);

    const k = norm(reference);
    if (seen.has(k)) {
      skipped++;
      return;
    }
    seen.add(k);
    lines.push({
      provider: guessProvider(reference),
      reference,
      amount: round2(amount),
      direction,
      date: new Date(dateText).toISOString(),
    });
  });

  return { lines, errors, skipped };
}
