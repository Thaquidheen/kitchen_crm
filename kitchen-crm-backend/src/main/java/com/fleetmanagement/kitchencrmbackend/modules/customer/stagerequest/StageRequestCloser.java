package com.fleetmanagement.kitchencrmbackend.modules.customer.stagerequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * A customer whose stage changed has nothing left to ask for: a request to move them, still waiting,
 * is closed — whichever way they moved (the status window, a redesign, a reopened quotation, a design
 * upload). Repositories only: the customer, design and quotation code all call it.
 */
@Component
public class StageRequestCloser {

    @Autowired
    private CustomerStageRequestRepository repository;

    /** The customer moved to the stage named (its screen label). */
    public void customerMoved(Long customerId, String toStageLabel) {
        if (customerId == null) {
            return;
        }
        for (CustomerStageRequest r : repository.findByCustomerIdAndStatus(customerId, CustomerStageRequest.PENDING)) {
            r.setStatus(CustomerStageRequest.CANCELLED);
            r.setDecidedAt(LocalDateTime.now());
            r.setDecisionNote("The customer was moved to " + toStageLabel + " meanwhile");
            r.setRequesterSeenAt(null);
            repository.save(r);
        }
    }
}
