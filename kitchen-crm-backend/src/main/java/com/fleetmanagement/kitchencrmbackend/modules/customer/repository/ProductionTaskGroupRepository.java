package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionTaskGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionTaskGroupRepository extends JpaRepository<ProductionTaskGroup, Long> {

    @Query("SELECT DISTINCT g FROM ProductionTaskGroup g " +
           "LEFT JOIN FETCH g.tasks " +
           "WHERE g.productionInstallation.customer.id = :customerId " +
           "ORDER BY g.sortOrder ASC")
    List<ProductionTaskGroup> findByCustomerIdWithTasks(@Param("customerId") Long customerId);

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
