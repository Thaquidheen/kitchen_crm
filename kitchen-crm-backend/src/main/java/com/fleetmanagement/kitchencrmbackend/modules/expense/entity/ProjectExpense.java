package com.fleetmanagement.kitchencrmbackend.modules.expense.entity;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import com.fleetmanagement.kitchencrmbackend.modules.vendor.entity.Vendor;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "project_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectExpense extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private CustomerProject project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "expense_category", nullable = false)
    private ExpenseCategory expenseCategory = ExpenseCategory.MISCELLANEOUS;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod; // CASH, UPI, NEFT, etc.

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "paid_by")
    private String paidBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ExpenseStatus status = ExpenseStatus.PAID;

    public enum ExpenseCategory {
        MATERIAL,
        LABOR,
        TRANSPORT,
        APPLIANCE,
        MISCELLANEOUS
    }

    public enum ExpenseStatus {
        PENDING,
        PAID,
        CANCELLED
    }
}
