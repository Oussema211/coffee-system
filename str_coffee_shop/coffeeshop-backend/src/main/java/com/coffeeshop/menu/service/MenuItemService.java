package com.coffeeshop.menu.service;

import com.coffeeshop.menu.dto.CreateMenuItemRequest;
import com.coffeeshop.menu.dto.MenuItemDTO;
import com.coffeeshop.menu.dto.UpdateMenuItemRequest;

import java.util.List;

public interface MenuItemService {
    List<MenuItemDTO> getAllMenuItems();
    MenuItemDTO getMenuItemById(Long id);
    MenuItemDTO createMenuItem(CreateMenuItemRequest request);
    MenuItemDTO updateMenuItem(Long id, UpdateMenuItemRequest request);
    MenuItemDTO toggleAvailability(Long id);
    void deleteMenuItem(Long id);
}
