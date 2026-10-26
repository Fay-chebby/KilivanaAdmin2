import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE, API_ORIGIN } from '../../../core/config/api.config';
import { ApiResponse } from '../../logistics/models/delivery.model';
import {
  KycApplication,
  KycDocumentResponse,
  KycResult,
  UserLite,
  isOpen,
  toApplications,
  unviewedCount,
} from '../models/kyc.model';

@Injectable({ providedIn: 'root' })
export class KycService {
  private http = inject(HttpClient);

  private docs = signal<KycDocumentResponse[]>([]);
  private users = signal<UserLite[]>([]);
  private viewed = signal<ReadonlySet<string>>(new Set()); // which documents this admin opened (kept in memory)

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly items = computed<KycApplication[]>(() =>
    toApplications(this.docs(), this.users(), this.viewed(), API_ORIGIN),
  );
  readonly stats = computed(() => {
    const open = this.items().filter(isOpen);
    const n = (...t: string[]) => open.filter((a) => t.includes(a.type)).length;
    return {
      total: open.length,
      pending: this.items().filter((a) => a.status === 'pending').length,
      farmers: n('farmer'),
      buyers: n('buyer'),
      suppliersInspectors: n('supplier', 'inspector'),
    };
  });

  get(id: string) {
    return this.items().find((a) => a.id === id);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [docs, users] = await Promise.all([
        this.unwrap(this.http.get<ApiResponse<KycDocumentResponse[]>>(`${API_BASE}/admin/kyc`)),
        this.unwrap(
          this.http.get<ApiResponse<UserLite[]>>(`${API_BASE}/admin/users`, {
            params: { page: 0, size: 1000 },
          }),
        ).catch(() => [] as UserLite[]),
      ]);
      this.docs.set(docs ?? []);
      this.users.set(users ?? []);
    } catch (e) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async ensureLoaded() {
    if (!this.docs().length) await this.load();
  }

  /** Admin opens a document. It counts as viewed, and a pending application moves to under review. */
  openDocument(_appId: string, docId: string) {
    this.viewed.update((s) => new Set(s).add(docId));
  }

  /** The backend approves per document, so every pending document of the person is approved. */
  async approve(id: string): Promise<KycResult> {
    const a = this.get(id);
    if (!a) return fail('Application not found.');
    if (!isOpen(a)) return fail('This application was already decided.');
    const left = unviewedCount(a);
    if (left)
      return fail(
        `Open ${left === 1 ? 'the remaining document' : `the remaining ${left} documents`} before approving.`,
      );
    return this.decide(
      a,
      (d) =>
        this.http.post<ApiResponse<KycDocumentResponse>>(
          `${API_BASE}/admin/kyc/${d}/approve`,
          null,
        ),
      `${a.name} was approved.`,
    );
  }

  async reject(id: string, reason: string): Promise<KycResult> {
    const a = this.get(id);
    if (!a) return fail('Application not found.');
    if (!isOpen(a)) return fail('This application was already decided.');
    const why = reason.trim();
    if (why.length < 10)
      return fail('Write a reason of at least 10 characters. The applicant will see it.');
    return this.decide(
      a,
      (d) =>
        this.http.post<ApiResponse<KycDocumentResponse>>(
          `${API_BASE}/admin/kyc/${d}/reject`,
          null,
          { params: { reason: why } },
        ),
      `${a.name} was rejected.`,
    );
  }

  private async decide(
    a: KycApplication,
    call: (docId: string) => Observable<ApiResponse<KycDocumentResponse>>,
    ok: string,
  ): Promise<KycResult> {
    const pending = this.docs().filter(
      (d) => String(d.userId) === a.id && String(d.status).toUpperCase() === 'PENDING',
    );
    const results = await Promise.allSettled(pending.map((d) => this.unwrap(call(String(d.id)))));
    await this.load();
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (!failed.length) return { ok: true, message: ok };
    const reason = this.msg(failed[0].reason);
    return fail(
      failed.length === pending.length
        ? reason
        : `${failed.length} of ${pending.length} documents could not be updated: ${reason}`,
    );
  }

  private async unwrap<T>(req: Observable<ApiResponse<T>>): Promise<T> {
    const res = await firstValueFrom(req);
    if (!res.success) throw new Error(res.error?.details || res.message || 'Request failed');
    return res.data;
  }

  private msg(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const b = e.error as Partial<ApiResponse<unknown>> | null;
      if (e.status === 0) return 'Cannot reach the server. Check that the backend is running.';
      if (e.status === 401 || e.status === 403)
        return 'You are not allowed to do this. Sign in again.';
      return b?.error?.details || b?.message || `Request failed (${e.status}).`;
    }
    return e instanceof Error ? e.message : 'Something went wrong.';
  }
}

const fail = (message: string): KycResult => ({ ok: false, message });
