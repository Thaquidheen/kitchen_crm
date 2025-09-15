package com.fleetmanagement.kitchencrmbackend.modules.product.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "accessories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Accessory extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @Column(name = "material_code", unique = true)
    private String materialCode;

    @Column(name = "width_mm")
    private Integer widthMm;

    @Column(name = "height_mm")
    private Integer heightMm;

    @Column(name = "depth_mm")
    private Integer depthMm;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    private String color;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "company_price", precision = 10, scale = 2)
    private BigDecimal companyPrice;

    @Column(nullable = false)
    private Boolean active = true;

    @PrePersist
    @PreUpdate
    private void calculateCompanyPrice() {
        if (mrp != null && discountPercentage != null) {
            BigDecimal discountMultiplier = BigDecimal.ONE.subtract(discountPercentage.divide(BigDecimal.valueOf(100)));
            this.companyPrice = mrp.multiply(discountMultiplier);
        }
    }
}