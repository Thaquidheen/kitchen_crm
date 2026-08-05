package com.fleetmanagement.kitchencrmbackend.modules.appliance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One uploaded quotation PDF belonging to an Appliance &amp; Quartz entry. The file itself lives
 * on disk under uploads/appliance-quotations; only its public URL and original name are stored.
 */
@Entity
@Table(name = "appliance_quotation_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplianceQuotationFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appliance_customer_id", nullable = false)
    private ApplianceCustomer applianceCustomer;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
