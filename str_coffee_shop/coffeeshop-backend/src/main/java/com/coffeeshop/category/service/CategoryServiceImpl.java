package com.coffeeshop.category.service;

import com.coffeeshop.category.dto.CategoryDTO;
import com.coffeeshop.category.dto.CreateCategoryRequest;
import com.coffeeshop.category.dto.UpdateCategoryRequest;
import com.coffeeshop.category.entity.Category;
import com.coffeeshop.category.repository.CategoryRepository;
import com.coffeeshop.auth.exception.BusinessException;
import com.coffeeshop.menu.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));
        return mapToDTO(category);
    }

    @Override
    public CategoryDTO createCategory(CreateCategoryRequest request) {
        String trimmedName = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("A category with the name '" + trimmedName + "' already exists.");
        }

        Category category = Category.builder()
                .name(trimmedName)
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .build();

        return mapToDTO(categoryRepository.save(category));
    }

    @Override
    public CategoryDTO updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        String trimmedName = request.getName().trim();

        // Check name uniqueness only if name is changing
        if (!category.getName().equalsIgnoreCase(trimmedName) &&
                categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("A category with the name '" + trimmedName + "' already exists.");
        }

        category.setName(trimmedName);
        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        return mapToDTO(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        long itemCount = menuItemRepository.countByCategoryId(id);
        if (itemCount > 0) {
            throw new BusinessException(
                    "Category '" + category.getName() + "' has " + itemCount
                            + " menu item(s) and cannot be deleted. Move or delete its items first.");
        }
        categoryRepository.deleteById(id);
    }

    private CategoryDTO mapToDTO(Category category) {
        long itemCount = menuItemRepository.countByCategoryId(category.getId());

        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .itemCount(itemCount)
                .build();
    }
}
