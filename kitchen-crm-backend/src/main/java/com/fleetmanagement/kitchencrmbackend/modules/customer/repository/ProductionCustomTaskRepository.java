package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionCustomTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionCustomTaskRepository extends JpaRepository<ProductionCustomTask, Long> {

    List<ProductionCustomTask> findByProductionInstallationIdOrderBySortOrderAsc(Long productionInstallationId);

    @Query("SELECT t FROM ProductionCustomTask t WHERE t.productionInstallation.customer.id = :customerId ORDER BY t.sortOrder ASC")
    List<ProductionCustomTask> findByCustomerIdOrderBySortOrderAsc(@Param("customerId") Long customerId);

    @Query("SELECT t FROM ProductionCustomTask t WHERE t.productionInstallation.customer.id = :customerId AND t.phase = :phase ORDER BY t.sortOrder ASC")
    List<ProductionCustomTask> findByCustomerIdAndPhaseOrderBySortOrderAsc(
            @Param("customerId") Long customerId,
            @Param("phase") ProductionCustomTask.TaskPhase phase);

    @Query("SELECT t FROM ProductionCustomTask t WHERE t.productionInstallation.customer.id = :customerId AND t.completed = :completed ORDER BY t.sortOrder ASC")
    List<ProductionCustomTask> findByCustomerIdAndCompletedOrderBySortOrderAsc(
            @Param("customerId") Long customerId,
            @Param("completed") Boolean completed);

    @Query("SELECT COUNT(t) FROM ProductionCustomTask t WHERE t.productionInstallation.customer.id = :customerId")
    Long countByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT COUNT(t) FROM ProductionCustomTask t WHERE t.productionInstallation.customer.id = :customerId AND t.completed = true")
    Long countCompletedByCustomerId(@Param("customerId") Long customerId);

    void deleteByProductionInstallationId(Long productionInstallationId);
}
