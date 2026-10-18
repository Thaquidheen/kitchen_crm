package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.DocumentType;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignatureAuditLogRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.repository.SignedDocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Deleting cancelled quotations from the Quotations list, the chosen ones or all of them. Only a
 * cancelled quotation is ever deleted; anything else that is asked for stays and is reported back
 * with the reason.
 *
 * <p>Each quotation is deleted in its own transaction, so one that cannot go does not undo the
 * others. A cancelled quotation that a business record still points at is kept: an expense in the
 * customer's finance, a customer project, the customer's design phase, or a signature the
 * customer gave. Signing requests that were never signed belong to the quotation only and go
 * with it.
 *
 * <p>No PDF of a quotation is stored: it is generated each time it is downloaded, so there is no
 * file to remove.
 */
@Slf4j
@Service
public class QuotationBulkDeleteService {

    /** What was asked for: the chosen quotations, or every cancelled one. */
    public record Request(List<Long> ids, Boolean allCancelled) {
    }

    /** A quotation that was not deleted, and why. */
    public record Skipped(Long id, String reason) {
    }

    public record Result(int deleted, List<Skipped> skipped) {
    }

    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private QuotationService quotationService;
    @Autowired
    private SignedDocumentRepository signedDocumentRepository;
    @Autowired
    private SignatureAuditLogRepository signatureAuditLogRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private PlatformTransactionManager transactionManager;

    public ApiResponse<Result> deleteCancelled(Request request) {
        Collection<Long> ids;
        if (request != null && Boolean.TRUE.equals(request.allCancelled())) {
            ids = quotationRepository.findByStatus(QuotationStatus.CANCELLED).stream()
                    .map(Quotation::getId)
                    .toList();
        } else {
            ids = new LinkedHashSet<>();
            if (request != null && request.ids() != null) {
                for (Long id : request.ids()) {
                    if (id != null) {
                        ids.add(id);
                    }
                }
            }
            if (ids.isEmpty()) {
                return ApiResponse.error("Choose the quotations to delete");
            }
        }

        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        int deleted = 0;
        List<Skipped> skipped = new ArrayList<>();
        for (Long id : ids) {
            String reason;
            try {
                reason = tx.execute(status -> {
                    String why = deleteOne(id);
                    if (why != null) {
                        status.setRollbackOnly();
                    }
                    return why;
                });
            } catch (RuntimeException e) {
                log.warn("Bulk delete: quotation {} could not be deleted ({})", id, e.getClass().getSimpleName());
                reason = "Could not be deleted: something else in the software still uses it";
            }
            if (reason == null) {
                deleted++;
            } else {
                skipped.add(new Skipped(id, reason));
            }
        }
        log.info("Bulk delete of cancelled quotations: {} deleted, {} skipped", deleted, skipped.size());
        String message = deleted == 1 ? "1 quotation deleted" : deleted + " quotations deleted";
        return ApiResponse.success(message, new Result(deleted, skipped));
    }

    /** Deletes one quotation, or says why it stays (null when it was deleted). */
    private String deleteOne(Long id) {
        Quotation quotation = quotationRepository.findById(id).orElse(null);
        if (quotation == null) {
            return "Not found. It may have been deleted already";
        }
        if (quotation.getStatus() != QuotationStatus.CANCELLED) {
            return "Not cancelled";
        }
        List<SignedDocument> signing =
                signedDocumentRepository.findByDocumentTypeAndReferenceId(DocumentType.QUOTATION, id);
        if (quotation.getSignedDocument() != null
                || signing.stream().anyMatch(d -> d.getStatus() == SignatureStatus.SIGNED)) {
            return "The customer signed it. The signed record is kept";
        }
        if (linkedFrom("finance_expenses", id)) {
            return "An expense in the customer's finance is linked to it";
        }
        if (linkedFrom("customer_projects", id)) {
            return "A customer project is linked to it";
        }
        if (linkedFrom("design_phase", id)) {
            return "The customer's design phase is linked to it";
        }

        // Signing requests that were never signed: their audit trail first, then the requests.
        for (SignedDocument request : signing) {
            signatureAuditLogRepository.deleteAll(signatureAuditLogRepository.findBySignedDocumentId(request.getId()));
        }
        signedDocumentRepository.deleteAll(signing);

        ApiResponse<String> result = quotationService.deleteQuotation(id);
        return Boolean.TRUE.equals(result.getSuccess()) ? null : result.getMessage();
    }

    /**
     * Whether a row of this table points at the quotation through its quotation_id column. The
     * table names are fixed in this class, never taken from a request. customer_projects has no
     * entity any more, so these are read with plain SQL.
     */
    private boolean linkedFrom(String table, Long quotationId) {
        Integer rows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE quotation_id = ?", Integer.class, quotationId);
        return rows != null && rows > 0;
    }
}
