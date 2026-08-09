package com.coffeeshop.order.controller;

import com.coffeeshop.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @DeleteMapping("/older-than-seven-days")
    public ResponseEntity<Map<String, Long>> deleteOrdersOlderThanSevenDays() {
        long deletedCount = orderService.deleteOrdersOlderThanSevenDays();
        return ResponseEntity.ok(Map.of("deletedCount", deletedCount));
    }
}
