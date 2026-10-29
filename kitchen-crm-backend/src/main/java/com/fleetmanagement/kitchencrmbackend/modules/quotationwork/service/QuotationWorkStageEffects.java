package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity.QuotationJob;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.repository.QuotationJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * What a customer's stage does to quotation work on the board. Sent back to Design Stage (a
 * redesign, or moved there by hand) the quotation being prepared is for a design that is being
 * redone: the work leaves the board, and the approved new design brings the customer back under To
 * assign. Marked Lost, nothing is left to prepare. (The owner's rule, 2026-10-29.)
 *
 * Repositories only: the customer and design services call it.
 */
@Component
public class QuotationWorkStageEffects {

    private static final Set<String> OPEN = Set.of(QuotationJob.WAITING, QuotationJob.IN_PROGRESS);

    @Autowired
    private QuotationJobRepository jobRepository;

    /** The customer moved to this stage. Returns how many pieces of work left the board. */
    public int customerMoved(Long customerId, CustomerStatus to) {
        if (customerId == null || (to != CustomerStatus.DESIGN_STAGE && to != CustomerStatus.LOST)) {
            return 0;
        }
        int removed = 0;
        for (QuotationJob job : jobRepository.findByCustomerAndStatuses(customerId, OPEN)) {
            job.setStatus(QuotationJob.CANCELLED);
            job.setAssigneeNews(to == CustomerStatus.LOST ? "Customer marked Lost" : "Customer back in Design Stage: the design is being redone");
            jobRepository.save(job);
            removed++;
        }
        return removed;
    }

    /** The words added to a reply when work left the board. */
    public static String removed(int n) {
        return n == 0 ? "" : "; their quotation work was taken off the board";
    }
}
