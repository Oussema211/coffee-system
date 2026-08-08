package com.coffeeshop.order.service;

import com.coffeeshop.menu.entity.MenuItem;
import com.coffeeshop.menu.repository.MenuItemRepository;
import com.coffeeshop.order.dto.*;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderItem;
import com.coffeeshop.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    @Transactional
    public OrderDTO createOrder(CreateOrderRequest request) {
        Order order = Order.builder()
                .orderType(request.getOrderType())
                .tableNumber("Dine-in".equalsIgnoreCase(request.getOrderType()) ? request.getTableNumber() : null)
                .status("Preparing")
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + itemReq.getMenuItemId()));

            BigDecimal lineTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(lineTotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItemId(menuItem.getId())
                    .name(menuItem.getName())
                    .unitPrice(menuItem.getPrice())
                    .quantity(itemReq.getQuantity())
                    .paid(false)
                    .build();

            order.getItems().add(orderItem);
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);
        return mapToDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getActiveOrders() {
        return orderRepository.findByStatusNotOrderByCreatedAtDesc("Completed")
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));
        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        return mapToDTO(updated);
    }

    @Transactional
    public OrderDTO payOrder(Long orderId, PaymentRequest paymentRequest) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        if ("full".equalsIgnoreCase(paymentRequest.getPaymentType())) {
            for (OrderItem item : order.getItems()) {
                item.setPaid(true);
            }
            order.setStatus("Completed");
        } else if ("split".equalsIgnoreCase(paymentRequest.getPaymentType()) && paymentRequest.getItemIds() != null) {
            for (OrderItem item : order.getItems()) {
                if (paymentRequest.getItemIds().contains(item.getId())) {
                    item.setPaid(true);
                }
            }
            boolean allPaid = order.getItems().stream().allMatch(OrderItem::isPaid);
            if (allPaid) {
                order.setStatus("Completed");
            }
        }

        Order saved = orderRepository.save(order);
        return mapToDTO(saved);
    }

    private OrderDTO mapToDTO(Order order) {
        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(item -> OrderItemDTO.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItemId())
                        .name(item.getName())
                        .price(item.getUnitPrice())
                        .qty(item.getQuantity())
                        .paid(item.isPaid())
                        .selected(false)
                        .build())
                .collect(Collectors.toList());

        List<String> itemSummaries = order.getItems().stream()
                .map(item -> item.getQuantity() > 1 ? item.getName() + " x" + item.getQuantity() : item.getName())
                .collect(Collectors.toList());

        String formattedTime = order.getCreatedAt() != null ? order.getCreatedAt().format(TIME_FORMATTER) : "";

        return OrderDTO.builder()
                .id(order.getId())
                .table(order.getTableNumber())
                .type(order.getOrderType())
                .items(itemSummaries)
                .orderItems(itemDTOs)
                .total(order.getTotalAmount())
                .time(formattedTime)
                .status(order.getStatus())
                .build();
    }
}
