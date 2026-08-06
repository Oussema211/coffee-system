package com.coffeeshop.category.service;

import com.coffeeshop.category.dto.CategoryDTO;
import com.coffeeshop.category.dto.CreateCategoryRequest;
import com.coffeeshop.category.dto.UpdateCategoryRequest;

import java.util.List;

public interface CategoryService {
    List<CategoryDTO> getAllCategories();
    CategoryDTO getCategoryById(Long id);
    CategoryDTO createCategory(CreateCategoryRequest request);
    CategoryDTO updateCategory(Long id, UpdateCategoryRequest request);
    void deleteCategory(Long id);
}
