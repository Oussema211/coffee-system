package com.coffeeshop.order.service;

import com.coffeeshop.menu.entity.MenuItem;
import com.coffeeshop.menu.repository.MenuItemRepository;
import com.coffeeshop.order.dto.*;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderItem;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.table.repository.RestaurantTableRepository;
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
    private final RestaurantTableRepository tableRepository;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");
    private static final List<String> INACTIVE_STATUSES = List.of("Completed", "Cancelled");

    @Transactional
    public OrderDTO createOrder(CreateOrderRequest request) {
        Integer tableNum = "Dine-in".equalsIgnoreCase(request.getOrderType()) ? request.getTableNumber() : null;

        Order order;
        boolean isExisting = false;

        if (tableNum != null) {
            List<Order> existingActive = orderRepository.findByTableNumberAndStatusNotIn(tableNum, INACTIVE_STATUSES);
            if (!existingActive.isEmpty()) {
                order = existingActive.get(0);
                isExisting = true;
            } else {
                order = Order.builder()
                        .orderType(request.getOrderType())
                        .tableNumber(tableNum)
                        .status("Preparing")
                        .totalAmount(BigDecimal.ZERO)
                        .items(new ArrayList<>())
                        .build();
            }
        } else {
            order = Order.builder()
                    .orderType(request.getOrderType())
                    .tableNumber(null)
                    .status("Preparing")
                    .totalAmount(BigDecimal.ZERO)
                    .items(new ArrayList<>())
                    .build();
        }

        BigDecimal additionalTotal = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + itemReq.getMenuItemId()));

            BigDecimal lineTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            additionalTotal = additionalTotal.add(lineTotal);

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

        order.setTotalAmount(order.getTotalAmount().add(additionalTotal));
        if (isExisting && "Served".equalsIgnoreCase(order.getStatus())) {
            order.setStatus("Preparing");
        }

        Order savedOrder = orderRepository.save(order);

        if (savedOrder.getTableNumber() != null) {
            tableRepository.findByNumber(savedOrder.getTableNumber()).ifPresent(t -> {
                if ("Available".equalsIgnoreCase(t.getStatus()) || "Cleaning".equalsIgnoreCase(t.getStatus())) {
                    t.setStatus("Occupied");
                    tableRepository.save(t);
                }
            });
        }

        return mapToDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getActiveOrders() {
        return orderRepository.findByStatusNotInOrderByCreatedAtDesc(INACTIVE_STATUSES)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        if ("Cancelled".equalsIgnoreCase(newStatus)) {
            return cancelOrder(orderId);
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        return mapToDTO(updated);
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        order.setStatus("Cancelled");
        Order cancelledOrder = orderRepository.save(order);

        if (cancelledOrder.getTableNumber() != null) {
            List<Order> remainingActive = orderRepository.findByTableNumberAndStatusNotIn(cancelledOrder.getTableNumber(), INACTIVE_STATUSES);
            if (remainingActive.isEmpty()) {
                tableRepository.findByNumber(cancelledOrder.getTableNumber()).ifPresent(t -> {
                    t.setStatus("Available");
                    tableRepository.save(t);
                });
            }
        }

        return mapToDTO(cancelledOrder);
    }

    @Transactional
    public OrderDTO payOrder(Long orderId, PaymentRequest paymentRequest) {
        Order targetOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        List<Order> ordersToPay = new ArrayList<>();
        if (targetOrder.getTableNumber() != null) {
            ordersToPay = orderRepository.findByTableNumberAndStatusNotIn(targetOrder.getTableNumber(), INACTIVE_STATUSES);
        }
        if (ordersToPay.isEmpty()) {
            ordersToPay.add(targetOrder);
        }

        if ("full".equalsIgnoreCase(paymentRequest.getPaymentType())) {
            for (Order o : ordersToPay) {
                for (OrderItem item : o.getItems()) {
                    item.setPaid(true);
                }
                o.setStatus("Completed");
                orderRepository.save(o);
            }
        } else if ("split".equalsIgnoreCase(paymentRequest.getPaymentType()) && paymentRequest.getItemIds() != null) {
            for (Order o : ordersToPay) {
                for (OrderItem item : o.getItems()) {
                    if (paymentRequest.getItemIds().contains(item.getId())) {
                        item.setPaid(true);
                    }
                }
                boolean allPaid = o.getItems().stream().allMatch(OrderItem::isPaid);
                if (allPaid) {
                    o.setStatus("Completed");
                }
                orderRepository.save(o);
            }
        }

        if (targetOrder.getTableNumber() != null) {
            List<Order> remainingActive = orderRepository.findByTableNumberAndStatusNotIn(targetOrder.getTableNumber(), INACTIVE_STATUSES);
            if (remainingActive.isEmpty()) {
                tableRepository.findByNumber(targetOrder.getTableNumber()).ifPresent(t -> {
                    t.setStatus("Cleaning");
                    tableRepository.save(t);
                });
            }
        }

        return mapToDTO(targetOrder);
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
