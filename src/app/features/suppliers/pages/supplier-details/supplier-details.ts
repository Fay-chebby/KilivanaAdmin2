import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupplierService } from '../../services/supplier.service';
import { SupplierActionDialog } from '../../components/supplier-action-dialog/Supplier action dialog ';

@Component({
  selector: 'app-supplier-details',
  imports: [RouterLink, SupplierActionDialog],
  templateUrl: './supplier-details.html',
  styleUrl: './supplier-details.scss',
})
export class SupplierDetails {
  private svc = inject(SupplierService);
  private router = inject(Router);
  private id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  dialog = signal<'delete' | 'suspend' | 'activate' | null>(null);
  // computed so the page updates after suspend / reinstate
  supplier = computed(() => this.svc.suppliers().find((s) => s.id === this.id) ?? null);
  notice = this.svc.notice;

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
    this.dialog.set(null);
    if (type === 'suspend') this.svc.suspend(this.id, reason);
    if (type === 'activate') this.svc.activate(this.id);
    if (type === 'delete') {
      this.svc.delete(this.id);
      this.router.navigate(['/suppliers']);
    }
  }
}
