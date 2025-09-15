package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.CategoryDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Category;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.CategoryRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public ApiResponse<List<CategoryDto>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<CategoryDto> categoryDtos = categories.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(categoryDtos);
    }

    @Override
    public ApiResponse<List<CategoryDto>> getActiveCategories() {
        List<Category> categories = categoryRepository.findByActiveTrue();
        List<CategoryDto> categoryDtos = categories.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ApiResponse.success(categoryDtos);
    }

    @Override
    public ApiResponse<CategoryDto> getCategoryById(Long id) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ApiResponse.error("Category not found");
        }
        return ApiResponse.success(convertToDto(category));
    }

    @Override
    public ApiResponse<CategoryDto> createCategory(CategoryDto categoryDto) {
        if (categoryRepository.existsByName(categoryDto.getName())) {
            return ApiResponse.error("Category name already exists");
        }

        Category category = convertToEntity(categoryDto);
        Category savedCategory = categoryRepository.save(category);
        return ApiResponse.success("Category created successfully", convertToDto(savedCategory));
    }

    @Override
    public ApiResponse<CategoryDto> updateCategory(Long id, CategoryDto categoryDto) {
        Category existingCategory = categoryRepository.findById(id).orElse(null);
        if (existingCategory == null) {
            return ApiResponse.error("Category not found");
        }

        if (!existingCategory.getName().equals(categoryDto.getName()) &&
                categoryRepository.existsByName(categoryDto.getName())) {
            return ApiResponse.error("Category name already exists");
        }

        existingCategory.setName(categoryDto.getName());
        existingCategory.setDescription(categoryDto.getDescription());
        existingCategory.setActive(categoryDto.getActive());

        Category updatedCategory = categoryRepository.save(existingCategory);
        return ApiResponse.success("Category updated successfully", convertToDto(updatedCategory));
    }

    @Override
    public ApiResponse<String> deleteCategory(Long id) {
        Category category = categoryRepository.findById(id).orElse(null);
        if (category == null) {
            return ApiResponse.error("Category not found");
        }

        category.setActive(false);
        categoryRepository.save(category);
        return ApiResponse.success("Category deleted successfully");
    }

    private CategoryDto convertToDto(Category category) {
        return new CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getActive()
        );
    }

    private Category convertToEntity(CategoryDto categoryDto) {
        Category category = new Category();
        category.setName(categoryDto.getName());
        category.setDescription(categoryDto.getDescription());
        category.setActive(categoryDto.getActive() != null ? categoryDto.getActive() : true);
        return category;
    }
}