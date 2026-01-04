/**
 * API Request and Response types
 */

import type { PaginatedResponse, User } from './common.types';

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

// API Error
export interface ApiError {
  success: false;
  message: string;
  data: null;
  status?: number;
  errors?: Record<string, string[]>;
}

// RTK Query base query error
export interface RTKQueryError {
  status: number;
  data: ApiError | { message: string };
}

// Generic list params
export interface ListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
}

// Generic paginated API response
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>;

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request config
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}
