package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.FetchType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // CATEGORY-SPECIFIC MARGIN PERCENTAGES
    @Column(name = "accessories_margin_percentage", precision = 5, scale = 2)
    private BigDecimal accessoriesMarginPercentage = BigDecimal.valueOf(20.00);

    @Column(name = "cabinets_margin_percentage", precision = 5, scale = 2)
    private BigDecimal cabinetsMarginPercentage = BigDecimal.valueOf(20.00);

    @Column(name = "doors_margin_percentage", precision = 5, scale = 2)
    private BigDecimal doorsMarginPercentage = BigDecimal.valueOf(20.00);

    @Column(name = "lighting_margin_percentage", precision = 5, scale = 2)
    private BigDecimal lightingMarginPercentage = BigDecimal.valueOf(20.00);

    // CATEGORY-SPECIFIC TAX PERCENTAGES
    @Column(name = "accessories_tax_percentage", precision = 5, scale = 2)
    private BigDecimal accessoriesTaxPercentage = BigDecimal.valueOf(18.00);

    @Column(name = "cabinets_tax_percentage", precision = 5, scale = 2)
    private BigDecimal cabinetsTaxPercentage = BigDecimal.valueOf(18.00);

    @Column(name = "doors_tax_percentage", precision = 5, scale = 2)
    private BigDecimal doorsTaxPercentage = BigDecimal.valueOf(18.00);

    @Column(name = "lighting_tax_percentage", precision = 5, scale = 2)
    private BigDecimal lightingTaxPercentage = BigDecimal.valueOf(18.00);

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

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationAccessory> accessories = new ArrayList<>();

    // Relationship with cabinets
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationCabinet> cabinets = new ArrayList<>();

    // Relationship with doors
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationDoor> doors = new ArrayList<>();

    // ADD THIS MISSING LIGHTING RELATIONSHIP:
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationLighting> lighting = new ArrayList<>();

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

    // Signature Integration Fields
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_document_id")
    private SignedDocument signedDocument;

    @Column(name = "quotation_signed_at")
    private LocalDateTime quotationSignedAt;

    // Important Note & Payment Terms
    @Column(name = "important_note", columnDefinition = "TEXT")
    private String importantNote;

    @Column(name = "payment_acceptance_pct")
    private BigDecimal paymentAcceptancePct;

    @Column(name = "payment_delivery_pct")
    private BigDecimal paymentDeliveryPct;

    @Column(name = "payment_installation_pct")
    private BigDecimal paymentInstallationPct;

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