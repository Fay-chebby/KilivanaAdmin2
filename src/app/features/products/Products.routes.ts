import { Routes } from '@angular/router';

import { ProductList } from './pages/product-list/product-list';
import { AddProduct } from './pages/add-product/add-product';
import { ProductDetails } from './pages/product-details/product-details';
import { EditProduct } from './pages/edit-product/edit-product';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    component: ProductList,
    title: 'Products',
  },

  {
    path: 'new',
    component: AddProduct,
    title: 'Add Product',
  },

  {
    path: ':id/edit',
    component: EditProduct,
    title: 'Edit Product',
  },

  {
    path: ':id',
    component: ProductDetails,
    title: 'Product Details',
  },
];
