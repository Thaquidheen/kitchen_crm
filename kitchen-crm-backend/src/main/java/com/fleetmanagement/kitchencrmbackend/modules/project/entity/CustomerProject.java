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

    @Column(name = "cash_in_hand", precision = 12, scale = 2)
    private BigDecimal cashInHand = BigDecimal.ZERO;

    @Column(name = "cash_in_account", precision = 12, scale = 2)
    private BigDecimal cashInAccount = BigDecimal.ZERO;

    @Column(name = "received_amount_total", precision = 12, scale = 2)
    private BigDecimal receivedAmountTotal = BigDecimal.ZERO;

    @Column(name = "total_expense", precision = 12, scale = 2)
    private BigDecimal totalExpense = BigDecimal.ZERO;

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

    // Calculated field for balance
    @Transient
    public BigDecimal getBalanceAmount() {
        BigDecimal received = (cashInHand != null ? cashInHand : BigDecimal.ZERO)
                .add(cashInAccount != null ? cashInAccount : BigDecimal.ZERO);
        return (totalAmount != null ? totalAmount : BigDecimal.ZERO).subtract(received);
    }
    @Transient
    public boolean canAcceptPayment(BigDecimal paymentAmount) {
        BigDecimal balance = getBalanceAmount();
        return balance.compareTo(paymentAmount) >= 0;
    }

    // Helper method to get payment completion percentage
    @Transient
    public BigDecimal getPaymentCompletionPercentage() {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal received = getCashInHand().add(getCashInAccount());
        return received.multiply(BigDecimal.valueOf(100))
                .divide(totalAmount, 2, java.math.RoundingMode.HALF_UP);
    }

    public enum ProjectStatus {
        ACTIVE, COMPLETED, CANCELLED, ON_HOLD, IN_PROGRESS
    }
}