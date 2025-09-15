package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "production_installation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductionInstallation extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "epd_received")
    private Boolean epdReceived = false;

    @Column(name = "site_visit_marking")
    private Boolean siteVisitMarking = false;

    @Column(name = "flooring_completed")
    private Boolean flooringCompleted = false;

    @Column(name = "ceiling_completed")
    private Boolean ceilingCompleted = false;

    @Column(name = "carcass_at_site")
    private Boolean carcassAtSite = false;

    @Column(name = "countertop_at_site")
    private Boolean countertopAtSite = false;

    @Column(name = "shutters_at_site")
    private Boolean shuttersAtSite = false;

    @Column(name = "carcass_installed")
    private Boolean carcassInstalled = false;

    @Column(name = "countertop_installed")
    private Boolean countertopInstalled = false;

    @Column(name = "shutters_installed")
    private Boolean shuttersInstalled = false;

    @Column(name = "appliances_received")
    private Boolean appliancesReceived = false;

    @Column(name = "appliances_installed")
    private Boolean appliancesInstalled = false;

    @Column(name = "lights_installed")
    private Boolean lightsInstalled = false;

    @Column(name = "handover_to_client")
    private Boolean handoverToClient = false;

    @Column(name = "client_feedback_photography", columnDefinition = "TEXT")
    private String clientFeedbackPhotography;
}