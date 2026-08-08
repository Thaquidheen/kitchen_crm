package com.fleetmanagement.kitchencrmbackend.modules.finance.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * One finance header per customer: manually entered total amount and the committed
 * cash-in-hand / cash-in-account split. Children (payments, expenses, releases) are
 * managed through their own repositories; balances are derived, never stored.
 */
@Entity
@Table(name = "customer_finance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFinance extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "committed_cash_in_hand", nullable = false, precision = 14, scale = 2)
    private BigDecimal committedCashInHand = BigDecimal.ZERO;

    @Column(name = "committed_cash_in_account", nullable = false, precision = 14, scale = 2)
    private BigDecimal committedCashInAccount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by")
    private String createdBy;
}
