/** Wrapper your backend puts around every successful response. Adjust to match your API. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Shape of an error body. Field errors look like { email: ['Email is already used'] }. */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-based page index
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
