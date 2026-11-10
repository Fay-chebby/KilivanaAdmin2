import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { SupplierService, errorMessage } from '../../services/supplier.service';

import { SupplierActionDialog } from '../../components/supplier-action-dialog/supplier-action-dialog';

import { Supplier, SupplierProduct } from '../../models/supplier.model';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [RouterLink, SupplierActionDialog, DecimalPipe],
  templateUrl: './supplier-details.html',
  styleUrl: './supplier-details.scss',
})
export class SupplierDetails {
  private readonly svc = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Supplier ID from the URL
  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  // Dialog state
  dialog = signal<'delete' | 'suspend' | 'activate' | null>(null);

  // General page state
  busy = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);

  // Supplier details
  supplier = signal<Supplier | null>(null);

  // Global notification
  notice = this.svc.notice;

  // Supplier products
  products = signal<SupplierProduct[]>([]);
  productsLoading = signal(false);
  productsError = signal<string | null>(null);

  constructor() {
    this.loadSupplier();
  }

  // -----------------------------------------
  // LOAD SUPPLIER DETAILS
  // -----------------------------------------

  loadSupplier(): void {
    if (!Number.isInteger(this.id) || this.id <= 0) {
      this.loading.set(false);
      this.error.set('Invalid supplier ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.svc.get$(this.id).subscribe({
      next: (supplier) => {
        this.supplier.set(supplier);
        this.loading.set(false);

        // Load products after supplier details are available.
        this.loadProducts(supplier.id);
      },

      error: (e) => {
        this.loading.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }

  // -----------------------------------------
  // LOAD SUPPLIER PRODUCTS
  // -----------------------------------------

  loadProducts(sellerId: number): void {
    this.productsLoading.set(true);
    this.productsError.set(null);

    this.svc.getProducts$(sellerId).subscribe({
      next: (items) => {
        this.products.set(items ?? []);
        this.productsLoading.set(false);
      },

      error: (e) => {
        this.products.set([]);
        this.productsError.set(errorMessage(e));
        this.productsLoading.set(false);
      },
    });
  }

  // -----------------------------------------
  // SUPPLIER INITIALS
  // -----------------------------------------

  initials(name: string): string {
    return (name || 'S')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  // -----------------------------------------
  // SUPPLIER ACTIONS
  // -----------------------------------------

  confirm(reason: string): void {
    const type = this.dialog();
    const s = this.supplier();

    if (!type || !s || this.busy()) {
      return;
    }

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
          this.supplier.set(null);
          this.router.navigate(['/suppliers']);
          return;
        }

        // Update the local supplier status immediately.
        if (type === 'suspend') {
          this.supplier.update((current) =>
            current
              ? {
                  ...current,
                  status: 'suspended',
                  suspensionReason: reason,
                }
              : null,
          );
        }

        if (type === 'activate') {
          this.supplier.update((current) =>
            current
              ? {
                  ...current,
                  status: 'active',
                  suspensionReason: null,
                }
              : null,
          );
        }
      },

      error: (e) => {
        this.busy.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }
}
