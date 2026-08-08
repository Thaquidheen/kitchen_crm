package com.fleetmanagement.kitchencrmbackend.modules.finance.entity;

import com.fleetmanagement.kitchencrmbackend.modules.vendor.entity.Vendor;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A payment released to a vendor against a customer's job (e.g. Ebco 50,000 cash in hand).
 * Optionally linked to a specific expense line of the same finance header.
 */
@Entity
@Table(name = "finance_vendor_releases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FinanceVendorRelease extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finance_id", nullable = false)
    private CustomerFinance finance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id")
    private FinanceExpense expense;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 20)
    private FinanceIncomePayment.PaymentMode mode;

    @Column(name = "release_date", nullable = false)
    private LocalDate releaseDate;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_by")
    private String createdBy;
}
