package com.coffeeshop.menu.config;

import com.coffeeshop.category.entity.Category;
import com.coffeeshop.category.repository.CategoryRepository;
import com.coffeeshop.menu.entity.MenuItem;
import com.coffeeshop.menu.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MenuDataInitializer implements CommandLineRunner {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (menuItemRepository.count() == 0) {
            List<MenuItem> defaultItems = List.of(
                    buildItem("Espresso", "Coffee", new BigDecimal("2.50"), true),
                    buildItem("Cappuccino", "Coffee", new BigDecimal("3.50"), true),
                    buildItem("Latte", "Coffee", new BigDecimal("3.80"), true),
                    buildItem("Iced Americano", "Coffee", new BigDecimal("3.00"), false),
                    buildItem("Croissant", "Pastry", new BigDecimal("2.20"), true),
                    buildItem("Blueberry Muffin", "Pastry", new BigDecimal("2.80"), true),
                    buildItem("Iced Matcha Latte", "Cold Drinks", new BigDecimal("4.20"), true),
                    buildItem("Earl Grey Tea", "Tea", new BigDecimal("2.60"), true)
            );

            menuItemRepository.saveAll(defaultItems);
        }
    }

    private MenuItem buildItem(String name, String categoryName, BigDecimal price, boolean available) {
        Category category = categoryRepository.findByNameIgnoreCase(categoryName)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(categoryName).build()));
        return MenuItem.builder()
                .name(name)
                .category(category)
                .price(price)
                .available(available)
                .build();
    }
}
