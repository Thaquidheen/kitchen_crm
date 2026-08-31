package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionTaskGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionTaskGroupRepository extends JpaRepository<ProductionTaskGroup, Long> {

    /**
     * Top-level stages only. Sub-stages arrive nested inside their parent via the subGroups
     * relation — returning them here as well would list every sub-stage twice, once inside its
     * stage and once beside it, and double every task in the checklist total.
     */
    @Query("SELECT DISTINCT g FROM ProductionTaskGroup g " +
           "LEFT JOIN FETCH g.tasks " +
           "WHERE g.productionInstallation.customer.id = :customerId " +
           "AND g.parentGroup IS NULL " +
           "ORDER BY g.sortOrder ASC")
    List<ProductionTaskGroup> findByCustomerIdWithTasks(@Param("customerId") Long customerId);

    /** Stage count for sort-order defaults; sub-stages number within their own stage. */
    @Query("SELECT COUNT(g) FROM ProductionTaskGroup g " +
           "WHERE g.productionInstallation.customer.id = :customerId AND g.parentGroup IS NULL")
    Long countTopLevelByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT g FROM ProductionTaskGroup g " +
           "WHERE g.productionInstallation.customer.id = :customerId " +
           "ORDER BY g.sortOrder ASC")
    List<ProductionTaskGroup> findByCustomerIdOrderBySortOrderAsc(@Param("customerId") Long customerId);

    @Query("SELECT COUNT(g) FROM ProductionTaskGroup g " +
           "WHERE g.productionInstallation.customer.id = :customerId")
    Long countByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT g FROM ProductionTaskGroup g " +
           "WHERE g.productionInstallation.id = :productionInstallationId " +
           "ORDER BY g.sortOrder ASC")
    List<ProductionTaskGroup> findByProductionInstallationIdOrderBySortOrderAsc(@Param("productionInstallationId") Long productionInstallationId);
}
