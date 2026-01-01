package com.fleetmanagement.kitchencrmbackend.modules.project.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "customer_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProject extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Column(name = "project_name")
    private String projectName;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "total_tax_amount", precision = 12, scale = 2)
    private BigDecimal totalTaxAmount = BigDecimal.ZERO;

    // COMMITMENT: What customer promised to pay
    @Column(name = "committed_in_hand", precision = 12, scale = 2)
    private BigDecimal committedInHand = BigDecimal.ZERO;

    @Column(name = "committed_in_account", precision = 12, scale = 2)
    private BigDecimal committedInAccount = BigDecimal.ZERO;

    // RECEIVED: What customer actually paid
    @Column(name = "received_in_hand", precision = 12, scale = 2)
    private BigDecimal receivedInHand = BigDecimal.ZERO;

    @Column(name = "received_in_account", precision = 12, scale = 2)
    private BigDecimal receivedInAccount = BigDecimal.ZERO;

    @Column(name = "received_amount_total", precision = 12, scale = 2)
    private BigDecimal receivedAmountTotal = BigDecimal.ZERO;

    // BALANCE: What customer owes (computed in database)
    @Column(name = "balance_in_hand", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal balanceInHand;

    @Column(name = "balance_in_account", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal balanceInAccount;

    @Column(name = "total_balance", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal totalBalance;

    // EXPENSES: What we paid to vendors
    @Column(name = "total_expense", precision = 12, scale = 2)
    private BigDecimal totalExpense = BigDecimal.ZERO;

    // PROFIT: Revenue - Expenses (computed in database)
    @Column(name = "profit_amount", precision = 12, scale = 2, insertable = false, updatable = false)
    private BigDecimal profitAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status = ProjectStatus.ACTIVE;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "expected_completion_date")
    private LocalDate expectedCompletionDate;

    @Column(name = "actual_completion_date")
    private LocalDate actualCompletionDate;

    @Column(name = "project_description", columnDefinition = "TEXT")
    private String projectDescription;

    @Column(name = "created_by")
    private String createdBy;

    // CATEGORY-SPECIFIC EDITED TAX PERCENTAGES (for cash calculation)
    @Column(name = "accessories_tax_percentage", precision = 5, scale = 2)
    private BigDecimal accessoriesTaxPercentage;

    @Column(name = "cabinets_tax_percentage", precision = 5, scale = 2)
    private BigDecimal cabinetsTaxPercentage;

    @Column(name = "doors_tax_percentage", precision = 5, scale = 2)
    private BigDecimal doorsTaxPercentage;

    @Column(name = "lighting_tax_percentage", precision = 5, scale = 2)
    private BigDecimal lightingTaxPercentage;

    // PER-KITCHEN TAX PERCENTAGES (stored as JSON: Map<kitchenId, KitchenTaxPercentages>)
    @Column(name = "kitchen_tax_percentages", columnDefinition = "TEXT")
    private String kitchenTaxPercentagesJson;

    // Helper methods for payment validation
    @Transient
    public boolean canAcceptCashPayment(BigDecimal paymentAmount) {
        if (balanceInHand == null) return false;
        return balanceInHand.compareTo(paymentAmount) >= 0;
    }

    @Transient
    public boolean canAcceptAccountPayment(BigDecimal paymentAmount) {
        if (balanceInAccount == null) return false;
        return balanceInAccount.compareTo(paymentAmount) >= 0;
    }

    // Backward compatibility - returns total balance
    @Transient
    public BigDecimal getBalanceAmount() {
        return totalBalance != null ? totalBalance : BigDecimal.ZERO;
    }

    // Helper method to get payment completion percentage
    @Transient
    public BigDecimal getPaymentCompletionPercentage() {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal received = receivedAmountTotal != null ? receivedAmountTotal : BigDecimal.ZERO;
        return received.multiply(BigDecimal.valueOf(100))
                .divide(totalAmount, 2, java.math.RoundingMode.HALF_UP);
    }

    public enum ProjectStatus {
        ACTIVE, COMPLETED, CANCELLED, ON_HOLD, IN_PROGRESS
    }
}