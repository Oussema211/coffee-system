package com.coffeeshop.menu.config;

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

    @Override
    public void run(String... args) {
        if (menuItemRepository.count() == 0) {
            List<MenuItem> defaultItems = List.of(
                    MenuItem.builder().name("Espresso").category("Coffee").price(new BigDecimal("2.50")).available(true).build(),
                    MenuItem.builder().name("Cappuccino").category("Coffee").price(new BigDecimal("3.50")).available(true).build(),
                    MenuItem.builder().name("Latte").category("Coffee").price(new BigDecimal("3.80")).available(true).build(),
                    MenuItem.builder().name("Iced Americano").category("Coffee").price(new BigDecimal("3.00")).available(false).build(),
                    MenuItem.builder().name("Croissant").category("Pastry").price(new BigDecimal("2.20")).available(true).build(),
                    MenuItem.builder().name("Blueberry Muffin").category("Pastry").price(new BigDecimal("2.80")).available(true).build(),
                    MenuItem.builder().name("Iced Matcha Latte").category("Cold Drinks").price(new BigDecimal("4.20")).available(true).build(),
                    MenuItem.builder().name("Earl Grey Tea").category("Tea").price(new BigDecimal("2.60")).available(true).build()
            );

            menuItemRepository.saveAll(defaultItems);
        }
    }
}
