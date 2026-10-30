import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';

import { SupplierService, errorMessage } from '../../services/supplier.service';

import { SupplierActionDialog } from '../../components/supplier-action-dialog/supplier-action-dialog';
import { SupplierProduct } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-details',
  imports: [RouterLink, SupplierActionDialog, DecimalPipe, DatePipe],
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

  // Supplier details
  supplier = computed(() => this.svc.suppliers().find((s) => s.id === this.id) ?? null);

  notice = this.svc.notice;

  // Supplier products
  products = signal<SupplierProduct[]>([]);
  productsLoading = signal(false);
  productsError = signal<string | null>(null);

  constructor() {
    this.svc.get$(this.id).subscribe({
      next: (supplier) => {
        this.loading.set(false);
        this.loadProducts(supplier.id);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }

  loadProducts(sellerId: number): void {
    this.productsLoading.set(true);
    this.productsError.set(null);

    this.svc.getProducts$(sellerId).subscribe({
      next: (items) => {
        this.products.set(items);
        this.productsLoading.set(false);
      },
      error: (e) => {
        this.productsError.set(errorMessage(e));
        this.productsLoading.set(false);
      },
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

  confirm(reason: string): void {
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

        if (type === 'delete') {
          this.router.navigate(['/suppliers']);
        }
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }
}
