package com.fleetmanagement.kitchencrmbackend.modules.product.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "light_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LightProfile extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "profile_type", nullable = false)
    private ProfileType profileType;

    @Column(name = "price_per_meter", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerMeter;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mrp;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "company_price", precision = 10, scale = 2)
    private BigDecimal companyPrice;

    @Column(nullable = false)
    private Boolean active = true;

    public enum ProfileType {
        A, B, C, D
    }

    @PrePersist
    @PreUpdate
    private void calculateCompanyPrice() {
        if (mrp != null && discountPercentage != null) {
            BigDecimal discountMultiplier = BigDecimal.ONE.subtract(discountPercentage.divide(BigDecimal.valueOf(100)));
            this.companyPrice = mrp.multiply(discountMultiplier);
        }
    }
}