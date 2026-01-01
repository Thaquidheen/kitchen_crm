package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotation_kitchens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchen extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    @Column(name = "kitchen_name", nullable = false)
    private String kitchenName;

    @Column(name = "kitchen_order", nullable = false)
    private Integer kitchenOrder;

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

    // KITCHEN TOTALS
    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "margin_amount", precision = 12, scale = 2)
    private BigDecimal marginAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "transportation_price", precision = 10, scale = 2)
    private BigDecimal transportationPrice = BigDecimal.ZERO;

    @Column(name = "installation_price", precision = 10, scale = 2)
    private BigDecimal installationPrice = BigDecimal.ZERO;

    // Relationships
    @OneToMany(mappedBy = "kitchen", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<QuotationKitchenPlanImage> planImages = new ArrayList<>();

    @OneToMany(mappedBy = "kitchen", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<QuotationKitchenScopeDetail> scopeDetails = new ArrayList<>();

    @OneToMany(mappedBy = "kitchen", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationAccessory> accessories = new ArrayList<>();

    @OneToMany(mappedBy = "kitchen", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationCabinet> cabinets = new ArrayList<>();

    @OneToMany(mappedBy = "kitchen", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationDoor> doors = new ArrayList<>();

    @OneToMany(mappedBy = "kitchen", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuotationLighting> lighting = new ArrayList<>();
}


