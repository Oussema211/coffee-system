package com.coffeeshop.category.config;

import com.coffeeshop.category.entity.Category;
import com.coffeeshop.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1)
@RequiredArgsConstructor
public class CategoryDataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            List<Category> defaultCategories = List.of(
                    Category.builder().name("Coffee").description("Hot and iced espresso-based drinks").build(),
                    Category.builder().name("Pastry").description("Freshly baked croissants, muffins and more").build(),
                    Category.builder().name("Cold Drinks").description("Refreshing cold beverages and iced specialties").build(),
                    Category.builder().name("Tea").description("Premium hot and iced teas").build()
            );
            categoryRepository.saveAll(defaultCategories);
        }
    }
}
