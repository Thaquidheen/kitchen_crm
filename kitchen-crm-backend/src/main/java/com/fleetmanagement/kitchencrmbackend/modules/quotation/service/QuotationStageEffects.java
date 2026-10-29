package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest.QuotationEditRequestService;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * What a customer's stage does to that customer's quotations:
 * <ul>
 *   <li>Confirmed: one completed quotation becomes Approved (the one chosen, or the newest).</li>
 *   <li>Lost: every quotation that is still open (draft, on hold, completed) becomes Cancelled.</li>
 * </ul>
 * This rides on the customer's stage change, so whoever may change the stage causes it; the
 * "Change status" permission of the Quotations module is about setting a status by hand.
 */
@Service
@Transactional
public class QuotationStageEffects {

    public static final String APPROVE = "APPROVE";
    public static final String CANCEL = "CANCEL";

    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private QuotationEditRequestService editRequests;
    @Autowired
    private QuotationReopenedEffects reopenedEffects;

    /** The quotations a move to this stage would touch, newest first. Empty for other stages. */
    @Transactional(readOnly = true)
    public List<Quotation> affected(Long customerId, CustomerStatus newStatus) {
        List<Quotation> out = new ArrayList<>();
        if (customerId == null || (newStatus != CustomerStatus.CONFIRMED && newStatus != CustomerStatus.LOST)) {
            return out;
        }
        for (Quotation q : quotationRepository.findByCustomerId(customerId)) {
            QuotationStatus s = q.getStatus();
            boolean hit = newStatus == CustomerStatus.CONFIRMED
                    ? s == QuotationStatus.COMPLETE
                    : s == null || s == QuotationStatus.DRAFT || s == QuotationStatus.ON_HOLD || s == QuotationStatus.COMPLETE;
            if (hit) {
                out.add(q);
            }
        }
        out.sort(Comparator.comparing(Quotation::getId).reversed());
        return out;
    }

    /** For the status window: {action, quotations:[{id, quotationNumber, projectName, versionNumber, status}]}. */
    @Transactional(readOnly = true)
    public Map<String, Object> preview(Long customerId, CustomerStatus newStatus) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Quotation q : affected(customerId, newStatus)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", q.getId());
            row.put("quotationNumber", q.getQuotationNumber());
            row.put("projectName", q.getProjectName());
            row.put("versionNumber", q.getVersionNumber());
            row.put("status", q.getStatus() == null ? null : q.getStatus().name());
            rows.add(row);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("action", newStatus == CustomerStatus.CONFIRMED ? APPROVE : newStatus == CustomerStatus.LOST ? CANCEL : null);
        out.put("quotations", rows);
        return out;
    }

    /** Null when the choice is fine; otherwise why it cannot be used. Checked before anything is written. */
    @Transactional(readOnly = true)
    public String checkChoice(Long customerId, CustomerStatus newStatus, Long approveQuotationId) {
        if (approveQuotationId == null || newStatus != CustomerStatus.CONFIRMED) {
            return null;
        }
        boolean found = affected(customerId, newStatus).stream().anyMatch(q -> q.getId().equals(approveQuotationId));
        return found ? null : "That quotation is not a completed quotation of this customer";
    }

    /** Applies the change. Returns how many quotations changed. */
    public int apply(Long customerId, CustomerStatus newStatus, Long approveQuotationId, String by) {
        List<Quotation> hit = affected(customerId, newStatus);
        if (hit.isEmpty()) {
            return 0;
        }
        if (newStatus == CustomerStatus.CONFIRMED) {
            Quotation chosen = hit.get(0); // newest
            if (approveQuotationId != null) {
                chosen = hit.stream().filter(q -> q.getId().equals(approveQuotationId)).findFirst().orElse(chosen);
            }
            chosen.setStatus(QuotationStatus.APPROVED);
            chosen.setApprovedBy(by);
            chosen.setApprovedAt(LocalDate.now());
            quotationRepository.save(chosen);
            editRequests.closeFor(chosen.getId(), "The quotation was approved when the customer was confirmed");
            return 1;
        }
        for (Quotation q : hit) {
            q.setStatus(QuotationStatus.CANCELLED);
            quotationRepository.save(q);
            editRequests.closeFor(q.getId(), "The quotation was cancelled when the customer was marked lost");
            // Work reopened for it leaves the board with it.
            reopenedEffects.dropped(q);
        }
        return hit.size();
    }
}
