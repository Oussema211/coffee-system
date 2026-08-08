package com.coffeeshop.table.service;

import com.coffeeshop.order.dto.OrderItemDTO;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.repository.OrderRepository;
import com.coffeeshop.table.dto.CreateTableRequest;
import com.coffeeshop.table.dto.TableDTO;
import com.coffeeshop.table.entity.RestaurantTable;
import com.coffeeshop.table.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    @Override
    @Transactional(readOnly = true)
    public List<TableDTO> getAllTables() {
        return tableRepository.findAllByOrderByNumberAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TableDTO createTable(CreateTableRequest request) {
        if (tableRepository.existsByNumber(request.getNumber())) {
            throw new IllegalArgumentException("Table number " + request.getNumber() + " already exists");
        }
        RestaurantTable table = RestaurantTable.builder()
                .number(request.getNumber())
                .seats(request.getSeats())
                .status("Available")
                .build();
        return mapToDTO(tableRepository.save(table));
    }

    @Override
    public void deleteTable(Long id) {
        if (!tableRepository.existsById(id)) {
            throw new IllegalArgumentException("Table not found with id: " + id);
        }
        tableRepository.deleteById(id);
    }

    @Override
    public TableDTO updateTableStatus(Long id, String status) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Table not found with id: " + id));
        table.setStatus(status);
        RestaurantTable saved = tableRepository.save(table);
        return mapToDTO(saved);
    }

    private TableDTO mapToDTO(RestaurantTable t) {
        List<Order> activeOrders = orderRepository.findByTableNumberAndStatusNot(t.getNumber(), "Completed");

        Long activeOrderId = null;
        String since = null;
        List<OrderItemDTO> orderItems = new ArrayList<>();
        String computedStatus = t.getStatus();

        if (!activeOrders.isEmpty()) {
            Order firstOrder = activeOrders.get(0);
            activeOrderId = firstOrder.getId();
            if (firstOrder.getCreatedAt() != null) {
                since = firstOrder.getCreatedAt().format(TIME_FORMATTER);
            }
            if ("Available".equalsIgnoreCase(computedStatus)) {
                computedStatus = "Occupied";
            }
            for (Order order : activeOrders) {
                if (order.getItems() != null) {
                    for (var item : order.getItems()) {
                        orderItems.add(OrderItemDTO.builder()
                                .id(item.getId())
                                .menuItemId(item.getMenuItemId())
                                .name(item.getName())
                                .price(item.getUnitPrice())
                                .qty(item.getQuantity())
                                .paid(item.isPaid())
                                .selected(false)
                                .build());
                    }
                }
            }
        }

        return TableDTO.builder()
                .id(t.getId())
                .number(t.getNumber())
                .seats(t.getSeats())
                .status(computedStatus)
                .activeOrderId(activeOrderId)
                .since(since)
                .orderItems(orderItems)
                .build();
    }
}

