package com.coffeeshop.order.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @Column(name = "menu_item_id")
    private Long menuItemId;

    @Column(nullable = false)
    private String name;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "size")
    private String size;

    @Column(name = "sugar")
    private String sugar;

    @Builder.Default
    @Column(name = "size_delta", nullable = false, precision = 10, scale = 2)
    private BigDecimal sizeDelta = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private boolean paid = false;
}
