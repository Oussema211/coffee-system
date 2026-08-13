package com.coffeeshop.menu.service;

import com.coffeeshop.category.entity.Category;
import com.coffeeshop.category.repository.CategoryRepository;
import com.coffeeshop.menu.dto.CreateMenuItemRequest;
import com.coffeeshop.menu.dto.MenuItemDTO;
import com.coffeeshop.menu.dto.SizeOptionDTO;
import com.coffeeshop.menu.dto.UpdateMenuItemRequest;
import com.coffeeshop.menu.entity.MenuItem;
import com.coffeeshop.menu.entity.SizeOption;
import com.coffeeshop.menu.repository.MenuItemRepository;
import com.coffeeshop.util.VatUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAllMenuItems() {
        return menuItemRepository.findAllByOrderByCategory_NameAscNameAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemDTO getMenuItemById(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + id));
        return mapToDTO(item);
    }

    @Override
    public MenuItemDTO createMenuItem(CreateMenuItemRequest request) {
        MenuItem item = MenuItem.builder()
                .name(request.getName().trim())
                .category(resolveCategory(request.getCategory()))
                .price(request.getPrice())
                .vatRate(request.getVatRate() != null ? request.getVatRate() : VatUtils.DEFAULT_RATE)
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .imageUrl(request.getImageUrl())
                .hasSizes(Boolean.TRUE.equals(request.getHasSizes()))
                .hasSugar(Boolean.TRUE.equals(request.getHasSugar()))
                .build();
        syncSizes(item, request.getSizes());

        MenuItem saved = menuItemRepository.save(item);
        return mapToDTO(saved);
    }

    @Override
    public MenuItemDTO updateMenuItem(Long id, UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + id));

        item.setName(request.getName().trim());
        item.setCategory(resolveCategory(request.getCategory()));
        item.setPrice(request.getPrice());
        if (request.getVatRate() != null) {
            item.setVatRate(request.getVatRate());
        }
        if (request.getAvailable() != null) {
            item.setAvailable(request.getAvailable());
        }
        item.setImageUrl(request.getImageUrl());
        item.setHasSizes(Boolean.TRUE.equals(request.getHasSizes()));
        item.setHasSugar(Boolean.TRUE.equals(request.getHasSugar()));
        syncSizes(item, request.getSizes());

        MenuItem updated = menuItemRepository.save(item);
        return mapToDTO(updated);
    }

    @Override
    public MenuItemDTO toggleAvailability(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + id));

        item.setAvailable(!item.isAvailable());
        MenuItem updated = menuItemRepository.save(item);
        return mapToDTO(updated);
    }

    @Override
    public void deleteMenuItem(Long id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + id));
        menuItemRepository.delete(item);
        deleteStoredImage(item.getImageUrl());
    }

    /**
     * Removes the locally stored image file (if any) when a menu item is deleted.
     * External URLs (http/https) and any path outside the uploads directory are ignored.
     */
    private void deleteStoredImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        String path = imageUrl.trim();
        int index = path.indexOf("/uploads/");
        if (index < 0) {
            return;
        }

        String relative = path.substring(index + "/uploads/".length());
        if (relative.isBlank() || relative.contains("..")) {
            return;
        }

        try {
            Path base = Paths.get("uploads").toAbsolutePath().normalize();
            Path file = base.resolve(relative).normalize();
            if (!file.startsWith(base)) {
                return;
            }
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Failed to delete stored image {} for menu item {}", relative, imageUrl, e);
        }
    }

    private MenuItemDTO mapToDTO(MenuItem item) {
        List<SizeOptionDTO> sizeDTOs = item.getSizeOptions().stream()
                .map(size -> SizeOptionDTO.builder()
                        .name(size.getName())
                        .priceDelta(size.getPriceDelta())
                        .build())
                .collect(Collectors.toList());

        return MenuItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .category(item.getCategory() != null ? item.getCategory().getName() : null)
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .price(item.getPrice())
                .vatRate(item.getVatRate())
                .available(item.isAvailable())
                .imageUrl(com.coffeeshop.util.ImageUtils.resolveImageUrl(item.getImageUrl()))
                .hasSizes(item.isHasSizes())
                .hasSugar(item.isHasSugar())
                .sizes(sizeDTOs)
                .build();
    }

    /**
     * Replaces the persisted size options with the ones from the request.
     * Empty or null lists clear the existing options.
     */
    private void syncSizes(MenuItem item, List<SizeOptionDTO> sizes) {
        item.getSizeOptions().clear();
        if (sizes != null) {
            int sortOrder = 0;
            for (SizeOptionDTO dto : sizes) {
                if (dto.getName() == null || dto.getName().isBlank()) {
                    continue;
                }
                item.getSizeOptions().add(SizeOption.builder()
                        .menuItem(item)
                        .name(dto.getName().trim())
                        .priceDelta(dto.getPriceDelta() != null ? dto.getPriceDelta() : java.math.BigDecimal.ZERO)
                        .sortOrder(sortOrder++)
                        .build());
            }
        }
    }

    /**
     * Finds a category by name (case-insensitive) or creates it if it does not
     * exist yet. Keeps menu item creation friendly while the FK stays intact.
     */
    private Category resolveCategory(String categoryName) {
        String trimmed = categoryName.trim();
        return categoryRepository.findByNameIgnoreCase(trimmed)
                .orElseGet(() -> categoryRepository.save(
                        Category.builder().name(trimmed).build()));
    }
}
