package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "customer_pipeline")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPipeline extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "site_measurements", columnDefinition = "TEXT")
    private String siteMeasurements;

    @Column(name = "site_photos_uploaded")
    private Boolean sitePhotosUploaded = false;

    @Column(name = "requirements_fulfilled")
    private Boolean requirementsFulfilled = false;
}