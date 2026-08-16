package com.fleetmanagement.kitchencrmbackend.modules.warranty.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "warranty_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WarrantyCard extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "certificate_number", unique = true, length = 50)
    private String certificateNumber;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "project_completion_date")
    private LocalDate projectCompletionDate;

    @Column(name = "project_address", columnDefinition = "TEXT")
    private String projectAddress;

    @Column(name = "project_description", length = 500)
    private String projectDescription = "Modular Kitchen Design, Supply & Installation";

    @Column(name = "authorized_name", length = 255)
    private String authorizedName;

    @Column(name = "authorized_designation", length = 255)
    private String authorizedDesignation;

    @Column(name = "signature_date")
    private LocalDate signatureDate;

    @Column(name = "pdf_file_path", length = 500)
    private String pdfFilePath;

    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;

    @Column(name = "created_by", length = 255)
    private String createdBy;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;
}


