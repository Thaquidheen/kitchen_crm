package com.fleetmanagement.kitchencrmbackend.modules.quotation.entity;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPlanImage;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quotation_kitchen_plan_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuotationKitchenPlanImage extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kitchen_id", nullable = false)
    private QuotationKitchen kitchen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_plan_image_id", nullable = true)
    private CustomerPlanImage customerPlanImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "design_phase_file_id", nullable = true)
    private DesignPhaseFile designPhaseFile;

    @Column(name = "image_name", nullable = false)
    private String imageName;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "image_order", nullable = false)
    private Integer imageOrder; // 1-4
}


