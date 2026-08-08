package com.fleetmanagement.kitchencrmbackend.modules.finance.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One income payment entry (1st, 2nd, ... unlimited). Owns the PaymentMode enum
 * shared by vendor releases.
 */
@Entity
@Table(name = "finance_income_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FinanceIncomePayment extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finance_id", nullable = false)
    private CustomerFinance finance;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 20)
    private PaymentMode mode;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_by")
    private String createdBy;

    public enum PaymentMode {
        CASH_IN_HAND,
        CASH_IN_ACCOUNT
    }
}
