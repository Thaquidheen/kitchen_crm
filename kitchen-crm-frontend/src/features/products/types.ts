/**
 * Product Catalog Types
 */

import type { PaginatedResponse } from '../../types/common.types';

export type ActiveFlag = boolean;

export interface BaseEntity {
  id: number;
  name: string;
  description?: string;
  active: ActiveFlag;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category extends BaseEntity {}
export interface Brand extends BaseEntity {}
export interface Material extends BaseEntity {
  unitRatePerSqft: number;
}

export interface InnerPanelType extends BaseEntity {
  ratePerSqft: number;
  multiplier: number;
}

export interface CabinetType {
  id: number;
  name: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  materialId?: number;
  materialName?: string;
  fixedPrice: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoorType {
  id: number;
  name: string;
  brandId?: number;
  brandName?: string;
  material?: string;
  mrp: number;
  discountPercentage?: number;
  companyPrice?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Accessory {
  id: number;
  name: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  materialCode?: string;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  imageUrl?: string;
  color?: string;
  mrp: number;
  discountPercentage?: number;
  companyPrice?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Lighting sub-entities
export interface LightProfile {
  id: number;
  profileType: string; // backend enum string
  pricePerMeter: number;
  mrp: number;
  discountPercentage?: number;
  companyPrice?: number;
  active: boolean;
}

export interface Driver {
  id: number;
  wattage: number;
  price: number;
  mrp: number;
  discountPercentage?: number;
  companyPrice?: number;
  active: boolean;
}

export interface Connector {
  id: number;
  type: string; // backend enum string
  pricePerPiece: number;
  mrp: number;
  discountPercentage?: number;
  companyPrice?: number;
  active: boolean;
}

export interface Sensor {
  id: number;
  type: string; // backend enum string
  pricePerPiece: number;
  mrp: number;
  discountPercentage?: number;
  companyPrice?: number;
  active: boolean;
}

export interface ListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  active?: boolean;
  categoryId?: number;
  brandId?: number;
  materialId?: number;
}

export type Page<T> = PaginatedResponse<T>;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}


