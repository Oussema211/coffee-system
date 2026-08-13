package com.coffeeshop.menu.service;

import com.coffeeshop.menu.dto.CreateMenuItemRequest;
import com.coffeeshop.menu.dto.MenuItemDTO;
import com.coffeeshop.menu.dto.UpdateMenuItemRequest;
import com.coffeeshop.menu.entity.MenuItem;
import com.coffeeshop.menu.repository.MenuItemRepository;
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

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAllMenuItems() {
        return menuItemRepository.findAllByOrderByCategoryAscNameAsc()
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
                .category(request.getCategory().trim())
                .price(request.getPrice())
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .imageUrl(request.getImageUrl())
                .build();

        MenuItem saved = menuItemRepository.save(item);
        return mapToDTO(saved);
    }

    @Override
    public MenuItemDTO updateMenuItem(Long id, UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + id));

        item.setName(request.getName().trim());
        item.setCategory(request.getCategory().trim());
        item.setPrice(request.getPrice());
        if (request.getAvailable() != null) {
            item.setAvailable(request.getAvailable());
        }
        item.setImageUrl(request.getImageUrl());

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
        return MenuItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .category(item.getCategory())
                .price(item.getPrice())
                .available(item.isAvailable())
                .imageUrl(com.coffeeshop.util.ImageUtils.resolveImageUrl(item.getImageUrl()))
                .build();
    }
}
