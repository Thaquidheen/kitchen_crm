package com.fleetmanagement.kitchencrmbackend.modules.finance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A receipt/proof file (PDF or image) attached to exactly one of: an income payment,
 * an expense line, or a vendor release. MySQL cannot CHECK-constrain FK-cascade columns
 * (ERROR 3823), so the single-owner rule lives in FinanceServiceImpl.
 */
@Entity
@Table(name = "finance_receipt_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FinanceReceiptFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private FinanceIncomePayment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id")
    private FinanceExpense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "release_id")
    private FinanceVendorRelease release;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, length = 20)
    private Kind kind = Kind.RECEIPT;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public enum Kind {
        RECEIPT,
        QUOTE
    }
}
