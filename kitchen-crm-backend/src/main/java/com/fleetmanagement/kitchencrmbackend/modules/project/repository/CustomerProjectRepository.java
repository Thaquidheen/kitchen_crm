package com.fleetmanagement.kitchencrmbackend.modules.project.repository;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.CustomerProject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerProjectRepository extends JpaRepository<CustomerProject, Long> {

    List<CustomerProject> findByCustomerId(Long customerId);

    Optional<CustomerProject> findByQuotationId(Long quotationId);

    long countByStatus(CustomerProject.ProjectStatus status);

    @Query("SELECT p FROM CustomerProject p WHERE " +
            "(:customerId IS NULL OR p.customer.id = :customerId) AND " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:projectName IS NULL OR LOWER(p.projectName) LIKE LOWER(CONCAT('%', :projectName, '%'))) AND " +
            "(:fromDate IS NULL OR p.startDate >= :fromDate) AND " +
            "(:toDate IS NULL OR p.startDate <= :toDate)")
    Page<CustomerProject> findByFilters(@Param("customerId") Long customerId,
                                        @Param("status") CustomerProject.ProjectStatus status,
                                        @Param("projectName") String projectName,
                                        @Param("fromDate") LocalDate fromDate,
                                        @Param("toDate") LocalDate toDate,
                                        Pageable pageable);

    // Add these methods to CustomerProjectRepository interface

    @Query("SELECT SUM(p.totalAmount) FROM CustomerProject p")
    BigDecimal getTotalProjectValue();

    @Query("SELECT SUM(p.totalAmount) FROM CustomerProject p WHERE p.status = :status")
    BigDecimal getTotalValueByStatus(@Param("status") CustomerProject.ProjectStatus status);

    @Query("SELECT SUM(p.balanceAmount) FROM CustomerProject p WHERE p.status = 'ACTIVE'")
    BigDecimal getTotalPendingPayments();

    @Query("SELECT SUM(p.cashInHand) FROM CustomerProject p")
    BigDecimal getTotalCashInHand();

    @Query("SELECT SUM(p.cashInAccount) FROM CustomerProject p")
    BigDecimal getTotalCashInAccount();

    @Query("SELECT AVG(DATEDIFF(p.actualCompletionDate, p.startDate)) FROM CustomerProject p WHERE p.actualCompletionDate IS NOT NULL")
    Integer getAverageProjectDuration();

    @Query("SELECT COUNT(p) FROM CustomerProject p WHERE p.actualCompletionDate BETWEEN :fromDate AND :toDate")
    Integer countCompletedProjectsBetweenDates(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT p.projectName, p.customer.name, DATEDIFF(p.expectedCompletionDate, p.startDate), DATEDIFF(p.actualCompletionDate, p.startDate), p.status, p.totalAmount FROM CustomerProject p")
    List<Object[]> getProjectTimelineAnalysis();

    @Query("SELECT COUNT(p) FROM CustomerProject p WHERE p.totalAmount BETWEEN :minValue AND :maxValue")
    Long countProjectsByValueRange(@Param("minValue") BigDecimal minValue, @Param("maxValue") BigDecimal maxValue);
}