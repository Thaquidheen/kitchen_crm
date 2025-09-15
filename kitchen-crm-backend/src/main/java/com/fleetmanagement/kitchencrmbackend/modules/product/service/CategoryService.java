package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.CategoryDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;

import java.util.List;

public interface CategoryService {
    ApiResponse<List<CategoryDto>> getAllCategories();
    ApiResponse<List<CategoryDto>> getActiveCategories();
    ApiResponse<CategoryDto> getCategoryById(Long id);
    ApiResponse<CategoryDto> createCategory(CategoryDto categoryDto);
    ApiResponse<CategoryDto> updateCategory(Long id, CategoryDto categoryDto);
    ApiResponse<String> deleteCategory(Long id);
}