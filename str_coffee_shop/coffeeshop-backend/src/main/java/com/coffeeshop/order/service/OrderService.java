package com.coffeeshop.order.service;

import com.coffeeshop.auth.entity.User;
import com.coffeeshop.menu.entity.MenuItem;
import com.coffeeshop.menu.repository.MenuItemRepository;
import com.coffeeshop.order.dto.*;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.entity.OrderItem;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.table.repository.RestaurantTableRepository;
import com.coffeeshop.websocket.OrderWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantTableRepository tableRepository;
    private final OrderWebSocketHandler webSocketHandler;
    @Value("${coffee.shop.name:Coffee Shop}")
    private String shopName;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");
    private static final DateTimeFormatter RECEIPT_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final List<String> INACTIVE_STATUSES = List.of("Completed", "Cancelled");
    private static final List<String> NOT_ACTIVE_STATUSES = List.of("Completed", "Cancelled", "Pending");

    @Transactional
    public OrderDTO createOrder(CreateOrderRequest request) {
        Integer tableNum = ("Dine-in".equalsIgnoreCase(request.getOrderType())
                || "QR".equalsIgnoreCase(request.getOrderType())) ? request.getTableNumber() : null;

        Order order;
        boolean isExisting = false;

        if (tableNum != null && tableRepository.findByNumber(tableNum).isEmpty()) {
            throw new IllegalArgumentException("Table not found with number: " + tableNum);
        }

        if (tableNum != null && !"QR".equalsIgnoreCase(request.getOrderType())) {
            List<Order> existingActive = orderRepository.findByTableNumberAndStatusNotIn(tableNum, INACTIVE_STATUSES);
            if (!existingActive.isEmpty()) {
                order = existingActive.get(0);
                isExisting = true;
            } else {
                order = Order.builder()
                        .orderType(request.getOrderType())
                        .tableNumber(tableNum)
                        .status("QR".equalsIgnoreCase(request.getOrderType()) ? "Pending" : "Preparing")
                        .totalAmount(BigDecimal.ZERO)
                        .items(new ArrayList<>())
                        .build();
            }
        } else {
            order = Order.builder()
                    .orderType(request.getOrderType())
                    .tableNumber(tableNum)
                    .status("QR".equalsIgnoreCase(request.getOrderType()) ? "Pending" : "Preparing")
                    .totalAmount(BigDecimal.ZERO)
                    .items(new ArrayList<>())
                    .build();
        }

        BigDecimal additionalTotal = BigDecimal.ZERO;

        for (CreateOrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found with id: " + itemReq.getMenuItemId()));

            if ("QR".equalsIgnoreCase(request.getOrderType()) && !menuItem.isAvailable()) {
                throw new IllegalArgumentException("This menu item is currently unavailable");
            }

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
        if (order.getWorkerName() == null) {
            order.setWorkerName(currentWorkerName());
        }
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

        OrderDTO dto = mapToDTO(savedOrder);
        if ("QR".equalsIgnoreCase(savedOrder.getOrderType())) {
            broadcastAfterCommit("NEW_QR_ORDER", dto);
        } else {
            broadcastAfterCommit("ORDER_CREATED", dto);
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getActiveOrders() {
        return orderRepository.findByStatusNotInOrderByCreatedAtDesc(NOT_ACTIVE_STATUSES)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getPendingQrOrders() {
        return orderRepository.findByOrderTypeAndStatusOrderByCreatedAtDesc("QR", "Pending")
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

    /**
     * Builds the bill currently due for an order. For a table, all of its active
     * orders are combined so the customer receives one bill rather than one per
     * item-added order.
     */
    @Transactional(readOnly = true)
    public ReceiptDTO getReceipt(Long orderId) {
        Order targetOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        List<Order> receiptOrders = targetOrder.getTableNumber() == null
                ? List.of(targetOrder)
                : orderRepository.findByTableNumberAndStatusNotIn(targetOrder.getTableNumber(), INACTIVE_STATUSES);
        if (receiptOrders.isEmpty()) {
            receiptOrders = List.of(targetOrder);
        }

        List<OrderItemDTO> unpaidItems = receiptOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .filter(item -> !item.isPaid())
                .map(this::mapOrderItemToDTO)
                .toList();
        // A completed order can be reprinted even though all its items are paid.
        List<OrderItemDTO> items = unpaidItems.isEmpty()
                ? targetOrder.getItems().stream().map(this::mapOrderItemToDTO).toList()
                : unpaidItems;
        BigDecimal total = items.stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQty())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ReceiptDTO.builder()
                .shopName(shopName)
                .receiptNumber("BILL-" + targetOrder.getId())
                .orderId(targetOrder.getId())
                .tableNumber(targetOrder.getTableNumber())
                .orderType(targetOrder.getOrderType())
                .orderTime(targetOrder.getCreatedAt().format(RECEIPT_TIME_FORMATTER))
                .printedAt(LocalDateTime.now().format(RECEIPT_TIME_FORMATTER))
                .workerName(targetOrder.getWorkerName())
                .status(targetOrder.getStatus())
                .items(items)
                .total(total)
                .build();
    }

    @Transactional
    public long deleteOrdersOlderThanSevenDays() {
        return orderRepository.deleteByCreatedAtBefore(LocalDateTime.now().minusDays(7));
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        if ("Cancelled".equalsIgnoreCase(newStatus)) {
            return cancelOrder(orderId);
        }

        assignWorkerIfNeeded(order);
        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        OrderDTO dto = mapToDTO(updated);
        broadcastAfterCommit("ORDER_UPDATED", dto);
        return dto;
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        assignWorkerIfNeeded(order);
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

        OrderDTO dto = mapToDTO(cancelledOrder);
        broadcastAfterCommit("ORDER_CANCELLED", dto);
        return dto;
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
        } else if ("split".equalsIgnoreCase(paymentRequest.getPaymentType()) && paymentRequest.getItems() != null) {
            Map<Long, Integer> quantitiesToPay = paymentRequest.getItems().stream()
                    .filter(item -> item.getItemId() != null && item.getQuantity() != null)
                    .collect(Collectors.toMap(
                            PaymentItemRequest::getItemId,
                            PaymentItemRequest::getQuantity,
                            Integer::sum
                    ));
            if (quantitiesToPay.isEmpty()) {
                throw new IllegalArgumentException("Select at least one item to pay");
            }
            for (Order o : ordersToPay) {
                for (OrderItem item : new ArrayList<>(o.getItems())) {
                    Integer quantityToPay = quantitiesToPay.get(item.getId());
                    if (quantityToPay != null) {
                        if (item.isPaid() || quantityToPay < 1 || quantityToPay > item.getQuantity()) {
                            throw new IllegalArgumentException("Invalid quantity selected for " + item.getName());
                        }
                        if (quantityToPay.equals(item.getQuantity())) {
                            item.setPaid(true);
                        } else {
                            OrderItem paidPortion = OrderItem.builder()
                                    .order(o)
                                    .menuItemId(item.getMenuItemId())
                                    .name(item.getName())
                                    .unitPrice(item.getUnitPrice())
                                    .quantity(quantityToPay)
                                    .paid(true)
                                    .build();
                            item.setQuantity(item.getQuantity() - quantityToPay);
                            o.getItems().add(paidPortion);
                        }
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

        assignWorkerIfNeeded(targetOrder);
        OrderDTO dto = mapToDTO(targetOrder);
        broadcastAfterCommit("ORDER_PAID", dto);
        return dto;
    }

    private void broadcastAfterCommit(String eventType, Object payload) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    webSocketHandler.broadcast(eventType, payload);
                }
            });
        } else {
            webSocketHandler.broadcast(eventType, payload);
        }
    }

    private void assignWorkerIfNeeded(Order order) {
        if (order.getWorkerName() == null) {
            order.setWorkerName(currentWorkerName());
        }
    }

    private OrderDTO mapToDTO(Order order) {
        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(this::mapOrderItemToDTO)
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
                .workerName(order.getWorkerName())
                .status(order.getStatus())
                .build();
    }

    private OrderItemDTO mapOrderItemToDTO(OrderItem item) {
        return OrderItemDTO.builder()
                .id(item.getId())
                .menuItemId(item.getMenuItemId())
                .name(item.getName())
                .price(item.getUnitPrice())
                .qty(item.getQuantity())
                .paid(item.isPaid())
                .selected(false)
                .build();
    }

    private String currentWorkerName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() instanceof String) {
            return null;
        }

        if (authentication.getPrincipal() instanceof User user) {
            return user.getName() != null && !user.getName().isBlank() ? user.getName() : user.getUsername();
        }

        return authentication.getName();
    }
}
