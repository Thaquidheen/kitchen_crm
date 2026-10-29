package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity.QuotationJob;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.repository.QuotationJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * A completed quotation put back to Draft to be edited: a request to edit it approved, or its status
 * set back by hand. The other direction of QuotationCompletedEffects:
 * <ul>
 *   <li>The customer goes back from Follow Up to Quotation Stage: their quotation is being prepared
 *       again. Only from Follow Up; any other stage stays.</li>
 *   <li>The work on the board that handed the quotation in is open again: back in that person's
 *       list, first, Waiting, with the news. Not when somebody already has open work for the
 *       customer (that person has it), nor when the person is no longer active (the customer then
 *       waits under To assign, as one who moved into Quotation Stage).</li>
 * </ul>
 * Completing the quotation again — on the board, with "Mark completed", or by hand — closes that
 * work and moves the customer on to Follow Up again.
 *
 * Repositories only, like QuotationCompletedEffects: the services involved depend on this module.
 */
@Component
public class QuotationReopenedEffects {

    private static final Set<String> OPEN = Set.of(QuotationJob.WAITING, QuotationJob.IN_PROGRESS);
    /** Days the reopened work is given, as new work is by default. */
    private static final int DUE_DAYS = 7;

    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;
    @Autowired
    private QuotationJobRepository jobRepository;
    @Autowired
    private UserRepository userRepository;

    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    /**
     * After a completed quotation was put back to Draft. `note` is what the admin wrote on approving
     * (null when set back by hand). Returns the customer's name when they moved back to Quotation
     * Stage, else null.
     */
    public String reopened(Quotation quotation, Long byUserId, String by, String note) {
        if (quotation == null || quotation.getStatus() != QuotationStatus.DRAFT || quotation.getCustomer() == null) {
            return null;
        }
        reopenWork(quotation, byUserId, note);
        return moveBack(quotation, by);
    }

    /**
     * The reopened quotation is Completed again, other than through its work on the board ("Mark
     * completed", or its status by hand): that work is done too.
     */
    public void completedAgain(Quotation quotation, Long byUserId, String by) {
        if (quotation == null || quotation.getId() == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (QuotationJob job : jobRepository.findByQuotationAndStatuses(quotation.getId(), OPEN)) {
            job.setStatus(QuotationJob.COMPLETED);
            job.setCompletedAt(now);
            job.setCompletedByUserId(byUserId);
            job.setCompletedByName(by);
            if (job.getStartedAt() == null) {
                job.setStartedAt(now);
            }
            if (job.getAssigneeSeenAt() == null) {
                job.setAssigneeSeenAt(now);
            }
            jobRepository.save(job);
        }
    }

    /** The words added to a reply when the customer moved back. */
    public static String movedBack(String customerName) {
        return customerName == null ? "" : "; " + customerName + " moved to Quotation Stage";
    }

    private void reopenWork(Quotation quotation, Long byUserId, String note) {
        List<QuotationJob> done = jobRepository.findByQuotationAndStatuses(quotation.getId(), Set.of(QuotationJob.COMPLETED));
        if (done.isEmpty()) {
            return;
        }
        QuotationJob job = done.get(0);
        if (!jobRepository.findByCustomerAndStatuses(job.getCustomer().getId(), OPEN).isEmpty()) {
            return;
        }
        User assignee = userRepository.findById(job.getAssigneeUserId()).orElse(null);
        if (assignee == null || Boolean.FALSE.equals(assignee.getActive())) {
            return;
        }
        // Counted before the job joins the queue again.
        int first = jobRepository.findByAssigneeAndStatuses(job.getAssigneeUserId(), OPEN).stream()
                .map(QuotationJob::getQueuePosition).filter(Objects::nonNull).min(Integer::compare).orElse(1) - 1;
        LocalDate due = LocalDate.now(ZoneId.of(businessTimezone)).plusDays(DUE_DAYS);
        job.setStatus(QuotationJob.WAITING);
        job.setQueuePosition(first);
        job.setStartedAt(null);
        job.setCompletedAt(null);
        job.setCompletedByUserId(null);
        job.setCompletedByName(null);
        if (job.getDueDate() == null || job.getDueDate().isBefore(due)) {
            job.setDueDate(due);
        }
        String news = "Reopened for editing" + (note == null || note.isBlank() ? "" : ": " + note.trim());
        job.setAssigneeNews(news.length() > 255 ? news.substring(0, 255) : news);
        // Reopening your own work is not news to you.
        job.setAssigneeSeenAt(job.getAssigneeUserId().equals(byUserId) ? LocalDateTime.now() : null);
        // When it is completed again, the admin side is told again.
        job.setAdminSeenAt(null);
        job.setCoordinatorSeenAt(null);
        jobRepository.save(job);
    }

    private String moveBack(Quotation quotation, String by) {
        Customer customer = customerRepository.findById(quotation.getCustomer().getId()).orElse(null);
        if (customer == null || customer.getStatus() != CustomerStatus.FOLLOW_UP) {
            return null;
        }
        customer.setStatus(CustomerStatus.QUOTE_GIVEN);
        customerRepository.save(customer);

        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(CustomerStatus.FOLLOW_UP.name());
        history.setNewState(CustomerStatus.QUOTE_GIVEN.name());
        history.setChangedBy(by);
        history.setChangeReason("Quotation " + (quotation.getQuotationNumber() != null ? quotation.getQuotationNumber() + " " : "")
                + "reopened for editing");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
        return customer.getName();
    }
}
