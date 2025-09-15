package com.fleetmanagement.kitchencrmbackend.modules.quotation.repository;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
}
