/**
 * Products API - RTK Query endpoints
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import type {
  Category,
  Brand,
  Material,
  InnerPanelType,
  Cabinet,
  Door,
  Accessory,
  LightProfile,
  Driver,
  Connector,
  Sensor,
  ListParams,
} from './types';

export const productsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Categories - Read
    getCategories: builder.query<Category[], void>({
      query: () => API_ENDPOINTS.CATEGORIES.BASE,
      transformResponse: (response: ApiResponse<Category[]>) => response.data ?? [],
      providesTags: [{ type: 'Categories' }],
    }),
    getActiveCategories: builder.query<Category[], void>({
      query: () => API_ENDPOINTS.CATEGORIES.ACTIVE,
      transformResponse: (response: ApiResponse<Category[]>) => response.data ?? [],
      providesTags: [{ type: 'Categories' }],
    }),
    getCategoryById: builder.query<Category, number>({
      query: (id) => API_ENDPOINTS.CATEGORIES.BY_ID(id),
      transformResponse: (response: ApiResponse<Category>) => response.data as Category,
      providesTags: (_result, _error, id) => [{ type: 'Categories', id }],
    }),

    // Categories - Mutations
    createCategory: builder.mutation<Category, Omit<Category, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.CATEGORIES.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data as Category,
      invalidatesTags: [{ type: 'Categories' }],
    }),
    updateCategory: builder.mutation<Category, Category>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.CATEGORIES.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Category>) => response.data as Category,
      invalidatesTags: (_result, _error, arg) => [{ type: 'Categories', id: arg.id }, { type: 'Categories' }],
    }),
    deleteCategory: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.CATEGORIES.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Categories' }],
    }),

    // Brands - Read
    getBrands: builder.query<Brand[], void>({
      query: () => API_ENDPOINTS.BRANDS.BASE,
      transformResponse: (response: ApiResponse<Brand[]>) => response.data ?? [],
      providesTags: [{ type: 'Brands' }],
    }),
    getActiveBrands: builder.query<Brand[], void>({
      query: () => API_ENDPOINTS.BRANDS.ACTIVE,
      transformResponse: (response: ApiResponse<Brand[]>) => response.data ?? [],
      providesTags: [{ type: 'Brands' }],
    }),
    getBrandById: builder.query<Brand, number>({
      query: (id) => API_ENDPOINTS.BRANDS.BY_ID(id),
      transformResponse: (response: ApiResponse<Brand>) => response.data as Brand,
      providesTags: (_result, _error, id) => [{ type: 'Brands', id }],
    }),

    // Brands - Mutations
    createBrand: builder.mutation<Brand, Omit<Brand, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.BRANDS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Brand>) => response.data as Brand,
      invalidatesTags: [{ type: 'Brands' }],
    }),
    updateBrand: builder.mutation<Brand, Brand>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.BRANDS.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Brand>) => response.data as Brand,
      invalidatesTags: (_result, _error, arg) => [{ type: 'Brands', id: arg.id }, { type: 'Brands' }],
    }),
    deleteBrand: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.BRANDS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Brands' }],
    }),

    // Materials - Read
    getMaterials: builder.query<Material[], void>({
      query: () => API_ENDPOINTS.MATERIALS.BASE,
      transformResponse: (response: ApiResponse<Material[]>) => response.data ?? [],
      providesTags: [{ type: 'Materials' }],
    }),
    getActiveMaterials: builder.query<Material[], void>({
      query: () => API_ENDPOINTS.MATERIALS.ACTIVE,
      transformResponse: (response: ApiResponse<Material[]>) => response.data ?? [],
      providesTags: [{ type: 'Materials' }],
    }),
    getMaterialById: builder.query<Material, number>({
      query: (id) => API_ENDPOINTS.MATERIALS.BY_ID(id),
      transformResponse: (response: ApiResponse<Material>) => response.data as Material,
      providesTags: (_result, _error, id) => [{ type: 'Materials', id }],
    }),

    // Materials - Mutations
    createMaterial: builder.mutation<Material, Omit<Material, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.MATERIALS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Material>) => response.data as Material,
      invalidatesTags: [{ type: 'Materials' }],
    }),
    updateMaterial: builder.mutation<Material, Material>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.MATERIALS.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Material>) => response.data as Material,
      invalidatesTags: (_result, _error, arg) => [{ type: 'Materials', id: arg.id }, { type: 'Materials' }],
    }),
    deleteMaterial: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.MATERIALS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Materials' }],
    }),

    // Inner Panel Types - Read
    getInnerPanelTypes: builder.query<InnerPanelType[], void>({
      query: () => API_ENDPOINTS.INNER_PANELS.BASE,
      transformResponse: (response: ApiResponse<InnerPanelType[]>) => response.data ?? [],
      providesTags: [{ type: 'InnerPanels' }],
    }),
    getActiveInnerPanelTypes: builder.query<InnerPanelType[], void>({
      query: () => API_ENDPOINTS.INNER_PANELS.ACTIVE,
      transformResponse: (response: ApiResponse<InnerPanelType[]>) => response.data ?? [],
      providesTags: [{ type: 'InnerPanels' }],
    }),

    // Inner Panel Types - Mutations
    createInnerPanelType: builder.mutation<InnerPanelType, Omit<InnerPanelType, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.INNER_PANELS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<InnerPanelType>) => response.data as InnerPanelType,
      invalidatesTags: [{ type: 'InnerPanels' }],
    }),
    updateInnerPanelType: builder.mutation<InnerPanelType, InnerPanelType>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.INNER_PANELS.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<InnerPanelType>) => response.data as InnerPanelType,
      invalidatesTags: (_result, _error, arg) => [{ type: 'InnerPanels', id: arg.id }, { type: 'InnerPanels' }],
    }),
    deleteInnerPanelType: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.INNER_PANELS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'InnerPanels' }],
    }),

    // Cabinets - Read
    getCabinets: builder.query<Cabinet[], ListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.CABINETS.BASE, params: params || {} }),
      transformResponse: (response: PaginatedApiResponse<Cabinet>) => response.data?.content ?? [],
      providesTags: [{ type: 'Products', id: 'CABINETS' }],
    }),
    getCabinetById: builder.query<Cabinet, number>({
      query: (id) => API_ENDPOINTS.CABINETS.BY_ID(id),
      transformResponse: (response: ApiResponse<Cabinet>) => response.data as Cabinet,
      providesTags: (_result, _error, id) => [{ type: 'Products', id: `CABINET-${id}` }],
    }),

    // Cabinets - Mutations
    createCabinet: builder.mutation<Cabinet, Omit<Cabinet, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.CABINETS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Cabinet>) => response.data as Cabinet,
      invalidatesTags: [{ type: 'Products', id: 'CABINETS' }],
    }),
    updateCabinet: builder.mutation<Cabinet, Cabinet>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.CABINETS.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Cabinet>) => response.data as Cabinet,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Products', id: `CABINET-${arg.id}` },
        { type: 'Products', id: 'CABINETS' },
      ],
    }),
    deleteCabinet: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.CABINETS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Products', id: 'CABINETS' }],
    }),

    // Doors - Read
    getDoors: builder.query<Door[], ListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.DOORS.BASE, params: params || {} }),
      transformResponse: (response: PaginatedApiResponse<Door>) => response.data?.content ?? [],
      providesTags: [{ type: 'Products', id: 'DOORS' }],
    }),
    getDoorById: builder.query<Door, number>({
      query: (id) => API_ENDPOINTS.DOORS.BY_ID(id),
      transformResponse: (response: ApiResponse<Door>) => response.data as Door,
      providesTags: (_result, _error, id) => [{ type: 'Products', id: `DOOR-${id}` }],
    }),

    // Doors - Mutations
    createDoor: builder.mutation<Door, Omit<Door, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.DOORS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Door>) => response.data as Door,
      invalidatesTags: [{ type: 'Products', id: 'DOORS' }],
    }),
    updateDoor: builder.mutation<Door, Door>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.DOORS.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Door>) => response.data as Door,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Products', id: `DOOR-${arg.id}` },
        { type: 'Products', id: 'DOORS' },
      ],
    }),
    deleteDoor: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.DOORS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Products', id: 'DOORS' }],
    }),

    // Accessories - Read
    getAccessories: builder.query<Accessory[], ListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.ACCESSORIES.BASE, params: params || {} }),
      transformResponse: (response: PaginatedApiResponse<Accessory>) => response.data?.content ?? [],
      providesTags: [{ type: 'Products', id: 'ACCESSORIES' }],
    }),
    // Accessories with pagination metadata
    getAccessoriesPaginated: builder.query<{
      content: Accessory[];
      totalPages: number;
      totalElements: number;
      number: number;
    }, ListParams | void>({
      query: (params) => ({ url: API_ENDPOINTS.ACCESSORIES.BASE, params: params || {} }),
      transformResponse: (response: PaginatedApiResponse<Accessory>) => ({
        content: response.data?.content ?? [],
        totalPages: response.data?.totalPages ?? 0,
        totalElements: response.data?.totalElements ?? 0,
        number: response.data?.number ?? 0,
      }),
      providesTags: [{ type: 'Products', id: 'ACCESSORIES' }],
    }),
    getAccessoryById: builder.query<Accessory, number>({
      query: (id) => API_ENDPOINTS.ACCESSORIES.BY_ID(id),
      transformResponse: (response: ApiResponse<Accessory>) => response.data as Accessory,
      providesTags: (_result, _error, id) => [{ type: 'Products', id: `ACCESSORY-${id}` }],
    }),

    // Accessories - Mutations
    createAccessory: builder.mutation<Accessory, Omit<Accessory, 'id'>>({
      query: (body) => ({
        url: API_ENDPOINTS.ACCESSORIES.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Accessory>) => response.data as Accessory,
      invalidatesTags: [{ type: 'Products', id: 'ACCESSORIES' }],
    }),
    updateAccessory: builder.mutation<Accessory, Accessory>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.ACCESSORIES.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Accessory>) => response.data as Accessory,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Products', id: `ACCESSORY-${arg.id}` },
        { type: 'Products', id: 'ACCESSORIES' },
      ],
    }),
    deleteAccessory: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.ACCESSORIES.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Products', id: 'ACCESSORIES' }],
    }),
    uploadAccessoryImage: builder.mutation<Accessory, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/accessories/${id}/image`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Products', id: `ACCESSORY-${id}` },
        { type: 'Products', id: 'ACCESSORIES' },
      ],
      transformResponse: (response: ApiResponse<Accessory>) => response.data as Accessory,
    }),

    // Lighting sub-entities (simple lists)
    getLightProfiles: builder.query<LightProfile[], void>({
      query: () => API_ENDPOINTS.LIGHTING.PROFILES,
      transformResponse: (response: ApiResponse<LightProfile[]>) => response.data ?? [],
      providesTags: [{ type: 'Products' }],
    }),
    getDrivers: builder.query<Driver[], void>({
      query: () => API_ENDPOINTS.LIGHTING.DRIVERS,
      transformResponse: (response: ApiResponse<Driver[]>) => response.data ?? [],
      providesTags: [{ type: 'Products' }],
    }),
    getConnectors: builder.query<Connector[], void>({
      query: () => API_ENDPOINTS.LIGHTING.CONNECTORS,
      transformResponse: (response: ApiResponse<Connector[]>) => response.data ?? [],
      providesTags: [{ type: 'Products' }],
    }),
    getSensors: builder.query<Sensor[], void>({
      query: () => API_ENDPOINTS.LIGHTING.SENSORS,
      transformResponse: (response: ApiResponse<Sensor[]>) => response.data ?? [],
      providesTags: [{ type: 'Products' }],
    }),
  }),
});

export const {
  // Categories
  useGetCategoriesQuery,
  useGetActiveCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  // Brands
  useGetBrandsQuery,
  useGetActiveBrandsQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  // Materials
  useGetMaterialsQuery,
  useGetActiveMaterialsQuery,
  useGetMaterialByIdQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  // Inner Panel Types
  useGetInnerPanelTypesQuery,
  useGetActiveInnerPanelTypesQuery,
  useCreateInnerPanelTypeMutation,
  useUpdateInnerPanelTypeMutation,
  useDeleteInnerPanelTypeMutation,
  // Cabinets
  useGetCabinetsQuery,
  useGetCabinetByIdQuery,
  useCreateCabinetMutation,
  useUpdateCabinetMutation,
  useDeleteCabinetMutation,
  // Doors
  useGetDoorsQuery,
  useGetDoorByIdQuery,
  useCreateDoorMutation,
  useUpdateDoorMutation,
  useDeleteDoorMutation,
  // Accessories
  useGetAccessoriesQuery,
  useGetAccessoriesPaginatedQuery,
  useGetAccessoryByIdQuery,
  useCreateAccessoryMutation,
  useUpdateAccessoryMutation,
  useDeleteAccessoryMutation,
  useUploadAccessoryImageMutation,
  // Lighting
  useGetLightProfilesQuery,
  useGetDriversQuery,
  useGetConnectorsQuery,
  useGetSensorsQuery,
} = productsAPI;

export default productsAPI;


