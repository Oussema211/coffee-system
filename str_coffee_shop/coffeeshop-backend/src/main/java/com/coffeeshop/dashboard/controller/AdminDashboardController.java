package com.coffeeshop.dashboard.controller;

import com.coffeeshop.auth.entity.Role;
import com.coffeeshop.auth.repository.UserRepository;
import com.coffeeshop.dashboard.dto.AdminDashboardDTO;
import com.coffeeshop.dashboard.dto.AdminReportsDTO;
import com.coffeeshop.menu.repository.MenuItemRepository;
import com.coffeeshop.order.entity.Order;
import com.coffeeshop.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<AdminDashboardDTO> getDashboard() {
        LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();
        List<Order> allOrders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<Order> todaysOrders = allOrders.stream()
                .filter(order -> order.getCreatedAt() != null && !order.getCreatedAt().isBefore(startOfToday))
                .toList();

        BigDecimal todaysRevenue = todaysOrders.stream()
                .filter(order -> !"Cancelled".equalsIgnoreCase(order.getStatus()))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var workers = userRepository.findByRole(Role.WORKER);
        long totalWorkers = workers.size();
        long activeWorkers = workers.stream()
                .filter(user -> user.isEnabled())
                .count();
        long menuItems = menuItemRepository.count();
        long unavailableMenuItems = menuItemRepository.findAll().stream()
                .filter(item -> !item.isAvailable())
                .count();

        List<AdminDashboardDTO.RecentOrder> recentOrders = allOrders.stream()
                .limit(4)
                .map(order -> new AdminDashboardDTO.RecentOrder(
                        order.getId(),
                        order.getItems().stream()
                                .map(item -> item.getQuantity() > 1 ? item.getName() + " x" + item.getQuantity() : item.getName())
                                .reduce((first, second) -> first + ", " + second)
                                .orElse("No items"),
                        order.getWorkerName() == null ? "Customer / unavailable" : order.getWorkerName(),
                        order.getTotalAmount(),
                        order.getStatus()
                ))
                .toList();

        long pendingOrders = todaysOrders.stream()
                .filter(order -> "Pending".equalsIgnoreCase(order.getStatus()))
                .count();

        return ResponseEntity.ok(new AdminDashboardDTO(
                todaysRevenue,
                todaysOrders.size(),
                pendingOrders,
                activeWorkers,
                totalWorkers,
                menuItems,
                unavailableMenuItems,
                recentOrders
        ));
    }

    @GetMapping("/reports")
    @Transactional(readOnly = true)
    public ResponseEntity<AdminReportsDTO> getReports() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(7);
        List<Order> validWeekOrders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(order -> order.getCreatedAt() != null)
                .filter(order -> !"Cancelled".equalsIgnoreCase(order.getStatus()))
                .filter(order -> {
                    LocalDate orderDate = order.getCreatedAt().toLocalDate();
                    return !orderDate.isBefore(weekStart) && orderDate.isBefore(weekEnd);
                })
                .toList();

        Map<LocalDate, BigDecimal> salesByDay = new LinkedHashMap<>();
        for (int index = 0; index < 7; index++) {
            salesByDay.put(weekStart.plusDays(index), BigDecimal.ZERO);
        }
        Map<String, Long> quantitiesByItem = new LinkedHashMap<>();
        for (Order order : validWeekOrders) {
            LocalDate orderDate = order.getCreatedAt().toLocalDate();
            salesByDay.computeIfPresent(orderDate, (date, total) -> total.add(order.getTotalAmount()));
            order.getItems().forEach(item -> quantitiesByItem.merge(item.getName(), (long) item.getQuantity(), Long::sum));
        }

        BigDecimal weekTotal = validWeekOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageOrderValue = validWeekOrders.isEmpty()
                ? BigDecimal.ZERO
                : weekTotal.divide(BigDecimal.valueOf(validWeekOrders.size()), 2, java.math.RoundingMode.HALF_UP);

        List<AdminReportsDTO.DailySales> weekSales = salesByDay.entrySet().stream()
                .map(entry -> new AdminReportsDTO.DailySales(
                        entry.getKey().getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        entry.getValue()))
                .toList();
        List<AdminReportsDTO.TopItem> topItems = quantitiesByItem.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(4)
                .map(entry -> new AdminReportsDTO.TopItem(entry.getKey(), entry.getValue()))
                .toList();

        return ResponseEntity.ok(new AdminReportsDTO(
                weekTotal,
                averageOrderValue,
                topItems.isEmpty() ? "No sales yet" : topItems.getFirst().name(),
                weekSales,
                topItems
        ));
    }
}
