package com.coffeeshop.customer.controller;

import com.coffeeshop.menu.dto.MenuItemDTO;
import com.coffeeshop.menu.service.MenuItemService;
import com.coffeeshop.order.dto.CreateOrderRequest;
import com.coffeeshop.order.dto.OrderDTO;
import com.coffeeshop.order.service.OrderService;
import com.coffeeshop.table.dto.TableDTO;
import com.coffeeshop.table.repository.RestaurantTableRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Public endpoints used by customers after scanning a table QR code. */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class CustomerController {

    private final MenuItemService menuItemService;
    private final OrderService orderService;
    private final RestaurantTableRepository tableRepository;

    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemDTO>> getAvailableMenu() {
        return ResponseEntity.ok(menuItemService.getAllMenuItems().stream()
                .filter(MenuItemDTO::isAvailable)
                .toList());
    }

    @GetMapping("/tables/{number}")
    public ResponseEntity<TableDTO> getTable(@PathVariable int number) {
        return tableRepository.findByNumber(number)
                .map(table -> ResponseEntity.ok(TableDTO.builder()
                        .id(table.getId())
                        .number(table.getNumber())
                        .seats(table.getSeats())
                        .status(table.getStatus())
                        .build()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderDTO> placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        request.setOrderType("QR");
        return ResponseEntity.ok(orderService.createOrder(request));
    }
}
