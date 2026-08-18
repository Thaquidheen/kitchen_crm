package com.fleetmanagement.kitchencrmbackend.modules.finance.dto;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceIncomePayment;
import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceReceiptFile;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * The whole finance detail page in one payload: header, income block with derived
 * balances, payments, expense block with derived split/release figures, releases,
 * vendor totals and both margins. Nothing here is stored — see FinanceServiceImpl.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFinanceSummaryDto {

    private Long financeId;

    // Customer
    private Long customerId;
    private String customerName;
    private String customerContact;
    private String customerPlace;
    private String customerAddress;

    // Header
    private BigDecimal totalAmount;
    private BigDecimal committedCashInHand;
    private BigDecimal committedCashInAccount;
    private String notes;

    // Income (derived)
    private BigDecimal receivedTotal;
    private BigDecimal receivedCashInHand;
    private BigDecimal receivedCashInAccount;
    private BigDecimal totalBalance;
    private BigDecimal cashInHandBalance;
    private BigDecimal cashInAccountBalance;
    private Boolean overCollected;
    /**
     * committedCashInHand + committedCashInAccount != totalAmount. The header stores the three
     * independently with no validation, and when they disagree the per-bucket margins cannot
     * re-sum to totalMargin. Surfaced so wrong data is visible rather than quietly skewing a split.
     */
    private Boolean committedSplitMismatch;

    // Expenses (derived)
    private BigDecimal expenseTotal;
    private BigDecimal expenseCashInHand;
    private BigDecimal expenseCashInAccount;
    private BigDecimal releasedTotal;
    private BigDecimal releasedCashInHand;
    private BigDecimal releasedCashInAccount;

    /**
     * Still owed / over-paid, clamped PER BUCKET and then summed — deliberately not
     * expenseTotal - releasedTotal. Settling a 100%-cash expense from the bank leaves you
     * outstanding in C/H and over in C/A at the same time; one net figure hides that, two clamped
     * figures name it. They still reconcile: outstandingTotal - extraTotal == expenseTotal - releasedTotal.
     */
    private BigDecimal outstandingTotal;
    private BigDecimal outstandingCashInHand;
    private BigDecimal outstandingCashInAccount;
    private BigDecimal extraTotal;
    private BigDecimal extraCashInHand;
    private BigDecimal extraCashInAccount;

    private BigDecimal totalMargin;
    private BigDecimal totalMarginCashInHand;
    private BigDecimal totalMarginCashInAccount;
    private BigDecimal collectedMargin;
    private BigDecimal collectedMarginCashInHand;
    private BigDecimal collectedMarginCashInAccount;

    private List<PaymentDto> payments = new ArrayList<>();
    private List<ExpenseDto> expenses = new ArrayList<>();
    private List<ReleaseDto> releases = new ArrayList<>();
    private List<VendorTotalDto> vendorTotals = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptDto {
        private Long id;
        private FinanceReceiptFile.Kind kind;
        private String fileUrl;
        private String fileName;
        private LocalDateTime uploadedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentDto {
        private Long id;
        private BigDecimal amount;
        private FinanceIncomePayment.PaymentMode mode;
        private LocalDate paymentDate;
        private String note;
        private String comment;
        private String createdBy;
        private List<ReceiptDto> receipts = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpenseDto {
        private Long id;
        private String title;
        private BigDecimal amount;
        private BigDecimal cashInHandPct;
        private BigDecimal cashInAccountPct;
        private BigDecimal cashInHandAmount;
        private BigDecimal cashInAccountAmount;
        private Long vendorId;
        private String vendorName;
        private Long quotationId;
        private String quotationNumber;
        private BigDecimal quotationTotal;
        private BigDecimal releasedAmount;
        private BigDecimal pendingAmount;
        private LocalDate expenseDate;
        private String note;
        private List<ReceiptDto> receipts = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReleaseDto {
        private Long id;
        private Long vendorId;
        private String vendorName;
        private Long expenseId;
        private String expenseTitle;
        private BigDecimal amount;
        private FinanceIncomePayment.PaymentMode mode;
        private LocalDate releaseDate;
        private String note;
        private List<ReceiptDto> receipts = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendorTotalDto {
        private Long vendorId;
        private String vendorName;
        /** Sum of expense lines assigned to this vendor (this customer's finance only). */
        private BigDecimal totalExpensed;
        private BigDecimal expensedCashInHand;
        private BigDecimal expensedCashInAccount;
        private BigDecimal totalReleased;
        private BigDecimal releasedCashInHand;
        private BigDecimal releasedCashInAccount;
        /** expensed − released. Negative means over-released — shown, never hidden. */
        private BigDecimal balance;
        /** Per-bucket balance, signed like {@link #balance} so cash and bank can disagree. */
        private BigDecimal balanceCashInHand;
        private BigDecimal balanceCashInAccount;
        private Long expenseCount;
        private Long releaseCount;
    }
}
