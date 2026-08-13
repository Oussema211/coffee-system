package com.coffeeshop.menu.entity;

import com.coffeeshop.category.entity.Category;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Builder.Default
    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate = new BigDecimal("19.00");

    @Builder.Default
    @Column(nullable = false)
    private boolean available = true;

    @Column(name = "image_url")
    private String imageUrl;

    @Builder.Default
    @Column(name = "has_sizes", nullable = false)
    private boolean hasSizes = false;

    @Builder.Default
    @Column(name = "has_sugar", nullable = false)
    private boolean hasSugar = false;

    @Builder.Default
    @Column(name = "has_extra_shot", nullable = false)
    private boolean hasExtraShot = false;

    @Builder.Default
    @Column(name = "extra_shot_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal extraShotPrice = new BigDecimal("0.50");

    @Builder.Default
    @OneToMany(mappedBy = "menuItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<SizeOption> sizeOptions = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
