package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    Optional<Quotation> findByQuotationNumber(String quotationNumber);
    List<Quotation> findByCustomerId(Long customerId);
    List<Quotation> findByStatus(Quotation.QuotationStatus status);
    Boolean existsByQuotationNumber(String quotationNumber);

    @Query("SELECT q FROM Quotation q WHERE " +
            "(:customerId IS NULL OR q.customer.id = :customerId) AND " +
            "(:status IS NULL OR q.status = :status) AND " +
            "(:customerName IS NULL OR LOWER(q.customer.name) LIKE LOWER(CONCAT('%', :customerName, '%'))) AND " +
            "(:fromDate IS NULL OR q.createdAt >= :fromDate) AND " +
            "(:toDate IS NULL OR q.createdAt <= :toDate)")
    Page<Quotation> findByFilters(@Param("customerId") Long customerId,
                                  @Param("status") Quotation.QuotationStatus status,
                                  @Param("customerName") String customerName,
                                  @Param("fromDate") LocalDateTime fromDate,
                                  @Param("toDate") LocalDateTime toDate,
                                  Pageable pageable);

    @Query("SELECT COUNT(q) FROM Quotation q WHERE q.status = :status")
    Long countByStatus(@Param("status") Quotation.QuotationStatus status);

    @Query("SELECT COALESCE(SUM(q.totalAmount), 0) FROM Quotation q WHERE q.status = 'APPROVED'")
    BigDecimal getTotalApprovedAmount();

    // Add these methods to QuotationRepository interface

    @Query("SELECT SUM(q.totalAmount) FROM Quotation q")
    BigDecimal getTotalQuotationValue();

    @Query("SELECT COUNT(q) FROM Quotation q WHERE q.createdAt BETWEEN :fromDate AND :toDate")
    Long countByDateRange(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COUNT(q) FROM Quotation q WHERE q.status = 'APPROVED' AND q.createdAt BETWEEN :fromDate AND :toDate")
    Long countApprovedByDateRange(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("SELECT SUM(q.totalAmount) FROM Quotation q WHERE q.createdAt BETWEEN :fromDate AND :toDate")
    BigDecimal getTotalValueByDateRange(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COUNT(q) FROM Quotation q WHERE q.createdAt < :date AND q.status = 'PENDING'")
    Long countOverdueQuotations(@Param("date") LocalDateTime date);

    @Query("SELECT COUNT(q) FROM Quotation q WHERE q.createdAt BETWEEN :fromDate AND :toDate")
    Long countByCreatedAtBetween(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    // unlinkFromProject removed with the Projects module. It detached quotations when a project
    // was deleted; there is no longer anything to detach from, and the JPQL referenced
    // Quotation.project, which Hibernate parses at startup — leaving it stopped the app booting.
    // The project_id column and its FK stay in the database, unmapped and permanently null.

    // Folder / version queries
    List<Quotation> findByFolderIdIn(List<Long> folderIds);
    List<Quotation> findByFolderIdOrderByVersionNumberDesc(Long folderId);
    Long countByFolderId(Long folderId);

    @Query("SELECT COALESCE(MAX(q.versionNumber), 0) FROM Quotation q WHERE q.folder.id = :folderId")
    Integer findMaxVersionNumberInFolder(@Param("folderId") Long folderId);
}
