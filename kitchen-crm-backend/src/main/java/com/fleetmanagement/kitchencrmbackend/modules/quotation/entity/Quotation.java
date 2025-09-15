package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "quotations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Quotation extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private CustomerProject project;

    @Column(name = "quotation_number", unique = true, nullable = false)
    private String quotationNumber;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "transportation_price", precision = 10, scale = 2)
    private BigDecimal transportationPrice = BigDecimal.ZERO;

    @Column(name = "installation_price", precision = 10, scale = 2)
    private BigDecimal installationPrice = BigDecimal.ZERO;

    @Column(name = "margin_percentage", precision = 5, scale = 2)
    private BigDecimal marginPercentage = BigDecimal.ZERO;

    @Column(name = "tax_percentage", precision = 5, scale = 2)
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "margin_amount", precision = 12, scale = 2)
    private BigDecimal marginAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // ACCESSORIES CATEGORY TOTALS
    @Column(name = "accessories_base_total", precision = 12, scale = 2)
    private BigDecimal accessoriesBaseTotal = BigDecimal.ZERO;

    @Column(name = "accessories_margin_amount", precision = 12, scale = 2)
    private BigDecimal accessoriesMarginAmount = BigDecimal.ZERO;

    @Column(name = "accessories_tax_amount", precision = 12, scale = 2)
    private BigDecimal accessoriesTaxAmount = BigDecimal.ZERO;

    @Column(name = "accessories_final_total", precision = 12, scale = 2)
    private BigDecimal accessoriesFinalTotal = BigDecimal.ZERO;

    // CABINETS CATEGORY TOTALS
    @Column(name = "cabinets_base_total", precision = 12, scale = 2)
    private BigDecimal cabinetsBaseTotal = BigDecimal.ZERO;

    @Column(name = "cabinets_margin_amount", precision = 12, scale = 2)
    private BigDecimal cabinetsMarginAmount = BigDecimal.ZERO;

    @Column(name = "cabinets_tax_amount", precision = 12, scale = 2)
    private BigDecimal cabinetsTaxAmount = BigDecimal.ZERO;

    @Column(name = "cabinets_final_total", precision = 12, scale = 2)
    private BigDecimal cabinetsFinalTotal = BigDecimal.ZERO;

    // DOORS CATEGORY TOTALS
    @Column(name = "doors_base_total", precision = 12, scale = 2)
    private BigDecimal doorsBaseTotal = BigDecimal.ZERO;

    @Column(name = "doors_margin_amount", precision = 12, scale = 2)
    private BigDecimal doorsMarginAmount = BigDecimal.ZERO;

    @Column(name = "doors_tax_amount", precision = 12, scale = 2)
    private BigDecimal doorsTaxAmount = BigDecimal.ZERO;

    @Column(name = "doors_final_total", precision = 12, scale = 2)
    private BigDecimal doorsFinalTotal = BigDecimal.ZERO;

    // LIGHTING CATEGORY TOTALS
    @Column(name = "lighting_base_total", precision = 12, scale = 2)
    private BigDecimal lightingBaseTotal = BigDecimal.ZERO;

    @Column(name = "lighting_margin_amount", precision = 12, scale = 2)
    private BigDecimal lightingMarginAmount = BigDecimal.ZERO;

    @Column(name = "lighting_tax_amount", precision = 12, scale = 2)
    private BigDecimal lightingTaxAmount = BigDecimal.ZERO;

    @Column(name = "lighting_final_total", precision = 12, scale = 2)
    private BigDecimal lightingFinalTotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "terms_conditions", columnDefinition = "TEXT")
    private String termsConditions;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDate approvedAt;

    public enum QuotationStatus {
        DRAFT, SENT, APPROVED, REJECTED, REVISED
    }

    // Generate quotation number before saving
    @PrePersist
    public void generateQuotationNumber() {
        if (this.quotationNumber == null) {
            this.quotationNumber = "QUO-" + java.time.Year.now() + "-" +
                    String.format("%06d", System.currentTimeMillis() % 1000000);
        }
    }
}