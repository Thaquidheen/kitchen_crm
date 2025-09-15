package com.fleetmanagement.kitchencrmbackend.modules.project.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Payment extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private CustomerProject project;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "received_by")
    private String receivedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.COMPLETED;

    public enum PaymentMethod {
        CASH, ACCOUNT_TRANSFER, CHEQUE, CARD, UPI, NEFT, RTGS
    }

    public enum PaymentStatus {
        PENDING, COMPLETED, FAILED, REFUNDED
    }
}