package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One item of a customer's requirement sheet that something was entered for (V166). The customer
 * is kept as a plain id: the database removes these rows when the customer is deleted.
 */
@Entity
@Table(name = "customer_requirement_items")
@Getter
@Setter
@NoArgsConstructor
public class CustomerRequirementItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "item_key", nullable = false, length = 80)
    private String itemKey;

    @Column(name = "section_key", nullable = false, length = 40)
    private String sectionKey;

    /** Only for a custom row; checklist items are named by the catalogue. */
    @Column(name = "label")
    private String label;

    /** NEEDED, NOT_NEEDED, or null while not marked. */
    @Column(name = "status", length = 12)
    private String status;

    @Column(name = "choice", length = 160)
    private String choice;

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "note", length = 1000)
    private String note;

    /** Only for a custom row: its place among the custom rows of its section. */
    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "updated_by_user_id")
    private Long updatedByUserId;

    @Column(name = "updated_by_name")
    private String updatedByName;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
