package com.coffeeshop.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardDTO(
        BigDecimal todaysRevenue,
        long ordersToday,
        long pendingOrders,
        long activeWorkers,
        long totalWorkers,
        long menuItems,
        long unavailableMenuItems,
        List<RecentOrder> recentOrders
) {
    public record RecentOrder(
            Long id,
            String items,
            String worker,
            BigDecimal total,
            String status
    ) {}
}
