package com.fleetmanagement.kitchencrmbackend.modules.design.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Design-job queries over the existing design_phase table. Kept apart from the legacy
 * DesignPhaseRepository so that file stays untouched.
 */
@Repository
public interface DesignJobRepository extends JpaRepository<DesignPhase, Long> {

    @EntityGraph(attributePaths = {"customer", "staffAssigned"})
    @Query("SELECT d FROM DesignPhase d")
    List<DesignPhase> findAllWithPeople();

    @EntityGraph(attributePaths = {"customer", "staffAssigned"})
    @Query("SELECT d FROM DesignPhase d WHERE d.staffAssigned.id = :userId")
    List<DesignPhase> findByDesigner(@Param("userId") Long userId);

    @EntityGraph(attributePaths = {"customer", "staffAssigned"})
    @Query("SELECT d FROM DesignPhase d WHERE d.customer.id = :customerId ORDER BY d.id DESC")
    List<DesignPhase> findByCustomerNewestFirst(@Param("customerId") Long customerId);

    @Query("SELECT COALESCE(MAX(d.queuePosition), 0) FROM DesignPhase d WHERE d.staffAssigned.id = :userId")
    Integer maxQueuePosition(@Param("userId") Long userId);

    /** [jobId, fileCount] pairs for the given jobs. */
    @Query("SELECT f.designPhase.id, COUNT(f) FROM DesignPhaseFile f WHERE f.designPhase.id IN :jobIds GROUP BY f.designPhase.id")
    List<Object[]> countFiles(@Param("jobIds") Collection<Long> jobIds);

    /** Customers in the Design stage with no live design job that has a designer. */
    @Query("SELECT c FROM Customer c WHERE c.status = :stage AND NOT EXISTS ("
            + "SELECT d.id FROM DesignPhase d WHERE d.customer = c AND d.staffAssigned IS NOT NULL "
            + "AND d.designStatus <> :cancelled) ORDER BY c.id DESC")
    List<Customer> findUnassignedDesignCustomers(@Param("stage") Customer.CustomerStatus stage,
                                                 @Param("cancelled") DesignPhase.DesignStatus cancelled);
}
