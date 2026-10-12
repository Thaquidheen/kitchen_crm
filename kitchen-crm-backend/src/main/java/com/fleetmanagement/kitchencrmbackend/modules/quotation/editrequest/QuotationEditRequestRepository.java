package com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuotationEditRequestRepository extends JpaRepository<QuotationEditRequest, Long> {

    List<QuotationEditRequest> findByStatusOrderByIdDesc(String status);

    List<QuotationEditRequest> findByQuotationIdAndStatus(Long quotationId, String status);

    List<QuotationEditRequest> findByRequestedByUserIdAndStatusOrderByIdDesc(Long userId, String status);

    /** What the admin's list shows under the open ones: answers given lately. */
    List<QuotationEditRequest> findByStatusNotAndDecidedAtAfterOrderByDecidedAtDesc(String status, LocalDateTime since);

    /** Approved lately: the quotations that may still be open for editing. */
    List<QuotationEditRequest> findByStatusAndDecidedAtAfterOrderByIdDesc(String status, LocalDateTime since);

    /** What one person asked for lately, answered or not. */
    List<QuotationEditRequest> findByRequestedByUserIdAndCreatedAtAfterOrderByIdDesc(Long userId, LocalDateTime since);
}
