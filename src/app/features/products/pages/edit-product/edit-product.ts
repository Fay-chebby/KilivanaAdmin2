import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductForm } from '../../components/product-form/product-form';
import { ProductPayload } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-edit-product',
  imports: [ProductForm, RouterLink],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.scss',
})
export class EditProduct {
  private readonly service = inject(ProductService);
  private readonly router = inject(Router);
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly product = computed(() => this.service.getById(this.id) ?? null);

  protected save(p: ProductPayload) {
    this.service.update(this.id, p);
    this.router.navigate(['/products', this.id]);
  }
  protected cancel() {
    this.router.navigate(['/products', this.id]);
  }
}
