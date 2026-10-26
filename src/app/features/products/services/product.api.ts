import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
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
import { API_BASE } from '../../../core/config/api.config';

type Params = Record<string, string | number | boolean>;

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  private readonly http = inject(HttpClient);

  /**
   * Applied to every request made through call().
   * Do not manually set Content-Type for FormData.
   */
  private readonly headers = new HttpHeaders({
    'ngrok-skip-browser-warning': 'true',
    Accept: 'application/json',
  });

  /**
   * Central API request handler.
   * Supports JSON requests, query parameters and FormData uploads.
   */
  private async call<T>(method: string, path: string, body?: unknown, params?: Params): Promise<T> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }

    try {
      const response = await firstValueFrom(
        this.http.request<ApiEnvelope<T>>(method, `${API_BASE}${path}`, {
          body,
          params: httpParams,
          headers: this.headers,
        }),
      );

      if (response?.success === false) {
        throw new Error(response.message || 'The API request failed.');
      }

      return response.data;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        console.error('Kilivana API request failed', {
          method,
          url: error.url,
          params,
          status: error.status,
          statusText: error.statusText,
          response: error.error,
          requestBody: body instanceof FormData ? '[FormData]' : body,
        });
      } else {
        console.error('Kilivana API error:', error);
      }

      throw error;
    }
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

  /**
   * Loads a page of admin products.
   */
  async listAllProducts(
    page = 0,
    size = 20,
  ): Promise<{
    items: ProductDto[];
    fallback: boolean;
    totalElements: number;
    totalPages: number;
  }> {
    try {
      const data = await this.call<PageDto<ProductDto>>('GET', '/admin/products', undefined, {
        page,
        size,
      });

      return {
        items: data?.content ?? [],
        fallback: false,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
      };
    } catch (error: unknown) {
      const status =
        error instanceof HttpErrorResponse ? error.status : (error as { status?: number })?.status;

      // Fall back only if the admin endpoint is unavailable
      // or access is denied. Do not hide HTTP 500 errors.
      if (![403, 404, 405].includes(status ?? 0)) {
        throw error;
      }

      const publicData = await this.call<unknown>('GET', '/products');

      if (Array.isArray(publicData)) {
        return {
          items: publicData as ProductDto[],
          fallback: true,
          totalElements: publicData.length,
          totalPages: 1,
        };
      }

      const pageData = publicData as Partial<PageDto<ProductDto>> | null;

      return {
        items: pageData?.content ?? [],
        fallback: true,
        totalElements: pageData?.totalElements ?? 0,
        totalPages: pageData?.totalPages ?? 0,
      };
    }
  }

  getStats(): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>('GET', '/admin/products/stats');
  }

  createProduct(req: ProductRequestDto, files: File[] = []): Promise<ProductDto> {
    if (files.length === 0) {
      return this.call<ProductDto>('POST', '/products', req);
    }

    const formData = new FormData();

    formData.append(
      'product',
      new Blob([JSON.stringify(req)], {
        type: 'application/json',
      }),
    );

    files.forEach((file) => {
      formData.append('images', file, file.name);
    });

    return this.call<ProductDto>('POST', '/products', formData);
  }

  updateProduct(id: number, req: ProductRequestDto): Promise<ProductDto> {
    return this.call<ProductDto>('PUT', `/products/${id}`, req);
  }

  deleteProduct(id: number): Promise<unknown> {
    return this.call<unknown>('DELETE', `/products/${id}`);
  }

  setProductStatus(
    id: number,
    status: string,
    reason?: string,
    extra: Record<string, unknown> = {},
  ): Promise<unknown> {
    const body: Record<string, unknown> = {
      ...extra,
      status,
    };

    if (reason?.trim()) {
      body['reason'] = reason.trim();
      body['statusReason'] = reason.trim();
    }

    return this.call<unknown>('PATCH', `/admin/products/${id}/status`, body);
  }

  uploadProductImage(id: number, file: File, isPrimary = false): Promise<ImageDto> {
    const formData = new FormData();

    formData.append('image', file, file.name);

    return this.call<ImageDto>('POST', `/products/${id}/images`, formData, { isPrimary });
  }

  deleteProductImage(productId: number, imageId: number): Promise<unknown> {
    return this.call<unknown>('DELETE', `/products/${productId}/images/${imageId}`);
  }

  // =========================================================
  // REFERENCE DATA
  // =========================================================

  listUsers(role: 'FARMER' | 'SUPPLIER' | 'INSPECTOR'): Promise<UserDto[]> {
    return this.call<UserDto[]>('GET', `/admin/users/role/${role}`);
  }

  listCategories(): Promise<CategoryDto[]> {
    return this.call<CategoryDto[]>('GET', '/categories/active');
  }

  async listFarms(): Promise<FarmDto[]> {
    try {
      const data = await this.call<unknown>('GET', '/admin/farms', undefined, {
        page: 0,
        size: 20,
      });

      console.log('Farms API response:', data);
      console.log('Response type:', typeof data);
      console.log('Is array:', Array.isArray(data));

      if (data && typeof data === 'object') {
        console.log('Response keys:', Object.keys(data as Record<string, unknown>));
      }

      return [];
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        console.error('HTTP status:', error.status);
        console.error('Backend error body:', error.error);
        console.error('Backend error details:', error.error?.error);
      } else {
        console.error('Unexpected error:', error);
      }

      throw error;
    }
  }

  // =========================================================
  // INSPECTIONS
  // =========================================================

  async listInspections(): Promise<InspectionDto[]> {
    const data = await this.call<unknown>('GET', '/admin/inspections', undefined, {
      page: 0,
      size: 100,
    });

    if (Array.isArray(data)) {
      return data as InspectionDto[];
    }

    if (data && typeof data === 'object') {
      const result = data as Partial<PageDto<InspectionDto>>;

      return result.content ?? [];
    }

    return [];
  }

  createInspection(req: InspectionRequestDto): Promise<InspectionDto> {
    return this.call<InspectionDto>('POST', '/admin/inspections', req);
  }

  setInspectionStatus(id: number, status: string): Promise<InspectionDto> {
    return this.call<InspectionDto>('PUT', `/admin/inspections/${id}/status`, undefined, {
      status,
    });
  }

  submitInspectionResult(
    id: number,
    result: string,
    req: InspectionRequestDto,
  ): Promise<InspectionDto> {
    return this.call<InspectionDto>('POST', `/admin/inspections/${id}/result`, req, { result });
  }

  listEvidence(id: number): Promise<ImageDto[]> {
    return this.call<ImageDto[]>('GET', `/admin/inspections/${id}/evidence/images`);
  }

  uploadEvidence(id: number, file: File): Promise<ImageDto[]> {
    const formData = new FormData();

    formData.append('image', file, file.name);

    return this.call<ImageDto[]>('POST', `/admin/inspections/${id}/evidence/images`, formData);
  }

  deleteEvidence(inspectionId: number, imageId: number): Promise<unknown> {
    return this.call<unknown>(
      'DELETE',
      `/admin/inspections/${inspectionId}/evidence/images/${imageId}`,
    );
  }

  /**
   * Fetches images already uploaded for a product.
   */
  listProductImages(productId: number): Promise<ImageDto[]> {
    return this.call<unknown>('GET', `/products/${productId}/images`).then((response) => {
      if (Array.isArray(response)) {
        return response as ImageDto[];
      }

      if (response && typeof response === 'object') {
        const result = response as Record<string, unknown>;

        if (Array.isArray(result['content'])) {
          return result['content'] as ImageDto[];
        }

        if (Array.isArray(result['images'])) {
          return result['images'] as ImageDto[];
        }
      }

      return [];
    });
  }
  // test for image

  // async testImageEndpoint(): Promise<void> {
  //   const url = `${this.base}/images/45`;

  //   try {
  //     const response = await firstValueFrom(
  //       this.http.get(url, {
  //         headers: new HttpHeaders({
  //           'ngrok-skip-browser-warning': 'true',
  //         }),
  //         responseType: 'blob',
  //       }),
  //     );

  //     console.log('Image response type:', response.type);
  //     console.log('Image response size:', response.size);

  //     if (response.type.startsWith('image/')) {
  //       console.log('Success: the endpoint returned image data.');
  //     } else {
  //       console.error('Still receiving a non-image response:', response.type);
  //       console.log(await response.text());
  //     }
  //   } catch (error) {
  //     console.error('Image endpoint test failed:', error);
  //   }
  // }
}
