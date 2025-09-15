package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
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
        DRAFT, SENT, APPROVED, REJECTED, REVISED, EXPIRED
    }

    // Helper method to generate quotation number
    @PrePersist
    public void generateQuotationNumber() {
        if (this.quotationNumber == null) {
            // Generate format: QT-YYYY-NNNNNN
            String year = String.valueOf(java.time.LocalDate.now().getYear());
            this.quotationNumber = "QT-" + year + "-" + System.currentTimeMillis();
        }
    }
}