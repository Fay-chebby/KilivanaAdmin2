import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupplierForm } from '../../components/supplier-form/supplier-form';
import { SupplierFormValue } from '../../models/supplier.model';
import { SupplierService } from '../../services/supplier.service';

@Component({
  selector: 'app-add-supplier',
  imports: [RouterLink, SupplierForm],
  templateUrl: './add-supplier.html',
  styleUrl: './add-supplier.scss',
})
export class AddSupplier {
  private svc = inject(SupplierService);
  private router = inject(Router);

  save(value: SupplierFormValue) {
    this.svc.create(value);
    this.router.navigate(['/suppliers']);
  }

  cancel() {
    this.router.navigate(['/suppliers']);
  }
}
