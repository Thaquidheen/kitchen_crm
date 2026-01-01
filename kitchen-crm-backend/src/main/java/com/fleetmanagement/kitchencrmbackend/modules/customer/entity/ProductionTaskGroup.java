package com.fleetmanagement.kitchencrmbackend.modules.customer.entity;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "production_task_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductionTaskGroup extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "production_installation_id", nullable = false)
    private ProductionInstallation productionInstallation;

    @Column(name = "group_title", nullable = false)
    private String groupTitle;

    @Column(name = "group_description", columnDefinition = "TEXT")
    private String groupDescription;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "is_expanded")
    private Boolean isExpanded = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @OneToMany(mappedBy = "taskGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ProductionCustomTask> tasks = new ArrayList<>();
}
