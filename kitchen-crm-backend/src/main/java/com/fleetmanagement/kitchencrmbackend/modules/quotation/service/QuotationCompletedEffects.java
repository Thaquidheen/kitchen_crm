package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

/**
 * A completed quotation moves its customer on to Follow Up: the quotation is ready, what comes
 * next is following the customer up. The other direction of QuotationStageEffects (a customer's
 * stage carrying their quotations along).
 *
 * Only forward: a customer still before Follow Up (Lead, Potential, Design Stage, Quotation Stage)
 * moves; one in Follow Up or further (Negotiations, Confirmed, Lost) stays where they are. Whoever
 * completes the quotation causes it, whatever their own right to change stages — it is the
 * quotation's effect, as approving one is when a customer is confirmed.
 *
 * It does what a move to Follow Up through the customer's status does (CustomerService): the stage
 * and a line in the stage history. Follow Up has no checks or effects of its own there. Done here
 * with the repositories, because CustomerService already depends on the quotation module.
 */
@Component
public class QuotationCompletedEffects {

    /** The stages a customer goes through before Follow Up. */
    public static final Set<CustomerStatus> BEFORE_FOLLOW_UP = EnumSet.of(
            CustomerStatus.LEAD, CustomerStatus.POTENTIAL, CustomerStatus.DESIGN_STAGE, CustomerStatus.QUOTE_GIVEN);

    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    /**
     * After a quotation was set to Completed: moves its customer on to Follow Up when they are still
     * before it. Returns the customer's name when they moved, else null.
     */
    public String completed(Quotation quotation, String by) {
        if (quotation == null || quotation.getStatus() != QuotationStatus.COMPLETE || quotation.getCustomer() == null) {
            return null;
        }
        Customer customer = customerRepository.findById(quotation.getCustomer().getId()).orElse(null);
        if (customer == null || !BEFORE_FOLLOW_UP.contains(customer.getStatus())) {
            return null;
        }
        String previous = customer.getStatus().name();
        customer.setStatus(CustomerStatus.FOLLOW_UP);
        customerRepository.save(customer);

        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previous);
        history.setNewState(CustomerStatus.FOLLOW_UP.name());
        history.setChangedBy(by);
        history.setChangeReason("Quotation " + (quotation.getQuotationNumber() != null ? quotation.getQuotationNumber() + " " : "")
                + "completed");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
        return customer.getName();
    }

    /** The words added to a reply when the customer moved. */
    public static String moved(String customerName) {
        return customerName == null ? "" : "; " + customerName + " moved to Follow Up";
    }
}
