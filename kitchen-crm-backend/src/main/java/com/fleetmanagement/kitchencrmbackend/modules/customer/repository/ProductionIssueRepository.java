package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductionIssueRepository extends JpaRepository<ProductionIssue, Long> {

    @Query("SELECT i FROM ProductionIssue i " +
           "WHERE i.productionInstallation.customer.id = :customerId " +
           "ORDER BY i.createdAt DESC")
    List<ProductionIssue> findByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT i FROM ProductionIssue i " +
           "WHERE i.productionInstallation.id = :productionInstallationId " +
           "ORDER BY i.createdAt DESC")
    List<ProductionIssue> findByProductionInstallationId(@Param("productionInstallationId") Long productionInstallationId);

    List<ProductionIssue> findByStatus(ProductionIssue.IssueStatus status);

    List<ProductionIssue> findByPriority(ProductionIssue.IssuePriority priority);

    @Query("SELECT i FROM ProductionIssue i " +
           "WHERE i.productionInstallation.customer.id = :customerId " +
           "AND i.status = :status " +
           "ORDER BY i.createdAt DESC")
    List<ProductionIssue> findByCustomerIdAndStatus(@Param("customerId") Long customerId,
                                                     @Param("status") ProductionIssue.IssueStatus status);

    @Query("SELECT COUNT(i) FROM ProductionIssue i " +
           "WHERE i.productionInstallation.customer.id = :customerId " +
           "AND i.status IN ('OPEN', 'IN_PROGRESS')")
    Long countOpenIssuesByCustomerId(@Param("customerId") Long customerId);
}
