// Type definitions for Settings API

export interface MarginsData {
  accessories: number;
  cabinets: number;
  doors: number;
  lighting: number;
  miscellaneous: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


