package com.fleetmanagement.kitchencrmbackend.modules.finance.entity;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
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
 * One planned expense line for a customer (title from the suggestion list or free text)
 * with a cash-in-hand / cash-in-account percentage split. The split amounts and the
 * released/pending balances are derived in the DTO, never stored.
 */
@Entity
@Table(name = "finance_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FinanceExpense extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finance_id", nullable = false)
    private CustomerFinance finance;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "cash_in_hand_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal cashInHandPct = BigDecimal.valueOf(100);

    @Column(name = "cash_in_account_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal cashInAccountPct = BigDecimal.ZERO;

    /** Optional: who the money goes to. Vendor-less lines (Installation, Incentive) stay legal. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Column(name = "expense_date")
    private LocalDate expenseDate;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_by")
    private String createdBy;
}
