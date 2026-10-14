import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductForm } from '../../components/product-form/product-form';
import { ProductPayload } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-add-product',
  imports: [ProductForm, RouterLink],
  templateUrl: './add-product.html',
  styleUrl: './add-product.scss',
})
export class AddProduct {
  private readonly service = inject(ProductService);
  private readonly router = inject(Router);

  protected async save(p: ProductPayload) {
    const created = await this.service.create(p);

    if (created) {
      await this.router.navigate(['/products', created.id]);
    }
  }

  protected cancel() {
    this.router.navigate(['/products']);
  }
}
