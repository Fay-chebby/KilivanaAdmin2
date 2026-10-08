import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService, errorMessage } from '../../services/supplier.service';
import { SupplierActionDialog } from '../../components/supplier-action-dialog/supplier-action-dialog';

@Component({
  selector: 'app-supplier-details',
  imports: [RouterLink, SupplierActionDialog],
  templateUrl: './supplier-details.html',
  styleUrl: './supplier-details.scss',
})
export class SupplierDetails {
  private svc = inject(SupplierService);
  private router = inject(Router);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  dialog = signal<'delete' | 'suspend' | 'activate' | null>(null);
  busy = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  // computed so the page updates after suspend / reinstate
  supplier = computed(() => this.svc.suppliers().find((s) => s.id === this.id) ?? null);
  notice = this.svc.notice;

  constructor() {
    this.svc.get$(this.id).subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  confirm(reason: string) {
    const type = this.dialog();
    const s = this.supplier();
    if (!type || !s) return;
    this.busy.set(true);
    this.error.set(null);
    const call$ =
      type === 'suspend'
        ? this.svc.suspend$(s, reason)
        : type === 'activate'
          ? this.svc.activate$(s)
          : this.svc.delete$(s);
    call$.subscribe({
      next: () => {
        this.busy.set(false);
        this.dialog.set(null);
        if (type === 'delete') this.router.navigate(['/suppliers']);
      },
      error: (e) => {
        this.busy.set(false);
        this.dialog.set(null);
        this.error.set(errorMessage(e));
      },
    });
  }
}
