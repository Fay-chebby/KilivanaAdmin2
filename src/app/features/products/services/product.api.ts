import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ApiEnvelope,
  CategoryDto,
  FarmDto,
  ImageDto,
  InspectionDto,
  InspectionRequestDto,
  PageDto,
  ProductDto,
  ProductRequestDto,
  UserDto,
} from '../models/productsapi.model';

type Params = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly http = inject(HttpClient);

  private readonly base =
    'https://either-juvenile-progeny.ngrok-free.dev/api/v1';

  private readonly headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
  });

  private async call<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Params,
  ): Promise<T> {
    const res = await firstValueFrom(
      this.http.request<ApiEnvelope<T>>(
        method,
        `${this.base}${path}`,
        {
          body,
          params,
          headers: this.headers,
        },
      ),
    );

    if (res?.success === false) {
      throw new Error(res.message || 'API request failed');
    }

    return res.data;
  }

  // Products

  async listAllProducts(): Promise<{
    items: ProductDto[];
    fallback: boolean;
  }> {
    try {
      const items: ProductDto[] = [];

      for (let page = 0; page < 100; page++) {
        const res = await this.call<PageDto<ProductDto>>(
          'GET',
          '/admin/products',
          undefined,
          { page, size: 200 },
        );

        items.push(...(res?.content ?? []));

        if (!res || res.last || !res.content?.length) {
          break;
        }
      }

      return { items, fallback: false };
    } catch (error) {
      const status = (error as { status?: number }).status;

      if ([403, 404, 405].includes(status ?? 0)) {
        return {
          items: await this.call<ProductDto[]>('GET', '/products'),
          fallback: true,
        };
      }

      throw error;
    }
  }

  getStats() {
    return this.call<Record<string, unknown>>(
      'GET',
      '/admin/products/stats',
    );
  }

  createProduct(req: ProductRequestDto, files: File[]) {
    if (!files.length) {
      return this.call<ProductDto>('POST', '/products', req);
    }

    const fd = new FormData();

    fd.append(
      'product',
      new Blob([JSON.stringify(req)], {
        type: 'application/json',
      }),
    );

    files.forEach((file) => {
      fd.append('images', file, file.name);
    });

    return this.call<ProductDto>('POST', '/products', fd);
  }

  updateProduct(id: number, req: ProductRequestDto) {
    return this.call<ProductDto>(
      'PUT',
      `/products/${id}`,
      req,
    );
  }

  deleteProduct(id: number) {
    return this.call<unknown>(
      'DELETE',
      `/products/${id}`,
    );
  }

  setProductStatus(
    id: number,
    status: string,
    reason?: string,
    extra: Record<string, unknown> = {},
  ) {
    const body: Record<string, unknown> = {
      status,
      ...extra,
    };

    if (reason) {
      body['reason'] = reason;
      body['statusReason'] = reason;
    }

    return this.call<unknown>(
      'PATCH',
      `/admin/products/${id}/status`,
      body,
    );
  }

  uploadProductImage(
    id: number,
    file: File,
    isPrimary = false,
  ) {
    const fd = new FormData();
    fd.append('image', file, file.name);

    return this.call<ImageDto>(
      'POST',
      `/products/${id}/images`,
      fd,
      { isPrimary },
    );
  }

  deleteProductImage(productId: number, imageId: number) {
    return this.call<unknown>(
      'DELETE',
      `/products/${productId}/images/${imageId}`,
    );
  }

  // Reference data

  listUsers(role: 'FARMER' | 'SUPPLIER' | 'INSPECTOR') {
    return this.call<UserDto[]>(
      'GET',
      `/admin/users/role/${role}`,
    );
  }

  listCategories() {
    return this.call<CategoryDto[]>(
      'GET',
      '/categories/active',
    );
  }

  async listFarms(): Promise<FarmDto[]> {
    const data = await this.call<unknown>(
      'GET',
      '/admin/farms',
      undefined,
      { page: 0, size: 500 },
    );

    const rows = Array.isArray(data)
      ? data
      : (
          (data as Record<string, unknown>)?.['content'] ??
          (data as Record<string, unknown>)?.['farms'] ??
          []
        );

    return (rows as FarmDto[]).filter(
      (farm) => farm && typeof farm.id === 'number',
    );
  }

  // Inspections

  listInspections() {
    return this.call<InspectionDto[]>(
      'GET',
      '/admin/inspections',
      undefined,
      { page: 0, size: 1000 },
    );
  }

  createInspection(req: InspectionRequestDto) {
    return this.call<InspectionDto>(
      'POST',
      '/admin/inspections',
      req,
    );
  }

  setInspectionStatus(id: number, status: string) {
    return this.call<InspectionDto>(
      'PUT',
      `/admin/inspections/${id}/status`,
      undefined,
      { status },
    );
  }

  submitInspectionResult(
    id: number,
    result: string,
    req: InspectionRequestDto,
  ) {
    return this.call<InspectionDto>(
      'POST',
      `/admin/inspections/${id}/result`,
      req,
      { result },
    );
  }

  listEvidence(id: number) {
    return this.call<ImageDto[]>(
      'GET',
      `/admin/inspections/${id}/evidence/images`,
    );
  }

  uploadEvidence(id: number, file: File) {
    const fd = new FormData();
    fd.append('image', file, file.name);

    return this.call<ImageDto[]>(
      'POST',
      `/admin/inspections/${id}/evidence/images`,
      fd,
    );
  }

  deleteEvidence(inspectionId: number, imageId: number) {
    return this.call<unknown>(
      'DELETE',
      `/admin/inspections/${inspectionId}/evidence/images/${imageId}`,
    );
  }
}