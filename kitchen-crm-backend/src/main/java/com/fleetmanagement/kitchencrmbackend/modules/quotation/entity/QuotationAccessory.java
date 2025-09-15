package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Accessory;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "quotation_accessories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationAccessory extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accessory_id", nullable = false)
    private Accessory accessory;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "custom_item")
    private Boolean customItem = false;

    @Column(name = "custom_item_name")
    private String customItemName;

    // Calculate base total price (without margin/tax)
    @PrePersist
    @PreUpdate
    public void calculateTotalPrice() {
        if (unitPrice != null && quantity != null) {
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
}