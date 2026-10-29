package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * A customer has at most one approved quotation: the one they were confirmed on. An approval is
 * taken back (the quotation is Completed again, nothing is deleted) when the customer leaves
 * Confirmed — by a redesign, or by moving them to any other stage by hand — and approving another
 * quotation of theirs takes the earlier approval back.
 *
 * Repositories only: the customer, design and quotation services all use it.
 */
@Component
public class QuotationApprovals {

    @Autowired
    private QuotationRepository quotationRepository;

    /** The customer left Confirmed: every approved quotation of theirs is Completed again. Returns how many. */
    public int takeBack(Long customerId) {
        return takeBackExcept(customerId, null);
    }

    /** Another quotation of the customer is approved: the earlier approvals are Completed again. Returns how many. */
    public int takeBackExcept(Long customerId, Long keepId) {
        if (customerId == null) {
            return 0;
        }
        int reopened = 0;
        for (Quotation q : quotationRepository.findByCustomerId(customerId)) {
            if (q.getStatus() == QuotationStatus.APPROVED && !q.getId().equals(keepId)) {
                q.setStatus(QuotationStatus.COMPLETE);
                q.setApprovedBy(null);
                q.setApprovedAt(null);
                quotationRepository.save(q);
                reopened++;
            }
        }
        return reopened;
    }

    /** Whether the customer has an approved quotation other than this one. */
    public boolean otherApproved(Long customerId, Long quotationId) {
        return customerId != null && quotationRepository.findByCustomerId(customerId).stream()
                .anyMatch(q -> q.getStatus() == QuotationStatus.APPROVED && !q.getId().equals(quotationId));
    }

    /** The words added to a reply when approvals were taken back. */
    public static String takenBack(int n) {
        return n == 0 ? "" : n == 1 ? "; the approved quotation is Completed again" : "; " + n + " approved quotations are Completed again";
    }
}
