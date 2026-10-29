package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest.QuotationEditRequest;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest.QuotationEditRequestRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity.QuotationJob;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.repository.QuotationJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * A completed quotation put back to Draft to be edited: a request to edit it approved, or its status
 * set back by hand. The other direction of QuotationCompletedEffects:
 * <ul>
 *   <li>The customer goes back from Follow Up to Quotation Stage: their quotation is being prepared
 *       again. Only from Follow Up; any other stage stays.</li>
 *   <li>The quotation is back in a person's list on the work board, first, Waiting, with the news:
 *       the work that handed it in, open again; for a quotation never handed in on the board, new
 *       work for whoever last prepared a quotation for the customer there. Not when somebody already
 *       has open work for the customer (that person has it), nor when that person is no longer
 *       active, nor when nobody ever prepared one on the board: the customer then waits under To
 *       assign, when the move to Quotation Stage put them there.</li>
 * </ul>
 * Completing the quotation again — on the board, with "Mark completed", by hand, or as a new version
 * of it ("Save as New") — closes that work and moves the customer on to Follow Up again; approving it
 * by hand closes the work too, cancelling it takes the work off the board.
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
    private QuotationRepository quotationRepository;
    @Autowired
    private QuotationEditRequestRepository editRequestRepository;
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
        // In Design Stage the design is being redone: the new design is priced when it is approved
        // (the customer then comes under To assign), not this quotation on the old one.
        if (!inDesignStage(quotation)) {
            reopenWork(quotation, byUserId, by, note);
        }
        return moveBack(quotation, by);
    }

    /** The words added to a reply when the reopened quotation stays off the board because the design is being redone. */
    public String designFirst(Quotation quotation) {
        return inDesignStage(quotation)
                ? "; " + quotation.getCustomer().getName() + " is in Design Stage: nothing goes on the board until the new design is approved"
                : "";
    }

    private boolean inDesignStage(Quotation quotation) {
        Customer customer = quotation == null || quotation.getCustomer() == null ? null
                : customerRepository.findById(quotation.getCustomer().getId()).orElse(null);
        return customer != null && customer.getStatus() == CustomerStatus.DESIGN_STAGE;
    }

    /**
     * The quotation is Completed or Approved again, other than through its work on the board ("Mark
     * completed", or by hand): the work reopened for it is done, handing it in. When it was a draft
     * till now (`fromDraft`), it may be the re-edit of an earlier version reopened before it was made
     * ("Save as New"): that work is done with it too, and that reopening is answered.
     */
    public void completedAgain(Quotation quotation, Long byUserId, String by, boolean fromDraft) {
        if (quotation == null || quotation.getId() == null || quotation.getCustomer() == null) {
            return;
        }
        Set<Long> reEdited = fromDraft ? reEditedBy(quotation) : Set.of();
        LocalDateTime now = LocalDateTime.now();
        for (QuotationJob job : jobRepository.findByCustomerAndStatuses(quotation.getCustomer().getId(), OPEN)) {
            Long reopenedFor = job.getQuotationId();
            if (reopenedFor == null || !(reopenedFor.equals(quotation.getId()) || reEdited.contains(reopenedFor))) {
                continue;
            }
            job.setStatus(QuotationJob.COMPLETED);
            job.setCompletedAt(now);
            job.setCompletedByUserId(byUserId);
            job.setCompletedByName(by);
            job.setQuotationId(quotation.getId());
            if (job.getStartedAt() == null) {
                job.setStartedAt(now);
            }
            if (job.getAssigneeSeenAt() == null) {
                job.setAssigneeSeenAt(now);
            }
            jobRepository.save(job);
        }
        reEdited.forEach(this::editsDone);
    }

    /**
     * A quotation was handed in on the board. When it was a draft till now, it may be the re-edit of
     * an earlier version reopened before it was made ("Save as New"): that reopening is answered.
     */
    public void handedIn(Quotation handedIn, boolean fromDraft) {
        if (handedIn != null && fromDraft) {
            reEditedBy(handedIn).forEach(this::editsDone);
        }
    }

    /**
     * The quotation was cancelled (by hand, or with its customer marked Lost). Work reopened for it
     * follows its re-edit when one is being made (a newer draft version of it); otherwise it leaves
     * the board.
     */
    public void dropped(Quotation quotation) {
        if (quotation == null || quotation.getId() == null) {
            return;
        }
        Quotation reEdit = quotation.getFolder() == null ? null
                : quotationRepository.findByFolderIdOrderByVersionNumberDesc(quotation.getFolder().getId()).stream()
                        .filter(q -> q.getId() > quotation.getId() && q.getStatus() == QuotationStatus.DRAFT)
                        .max(Comparator.comparing(Quotation::getId)).orElse(null);
        for (QuotationJob job : jobRepository.findByQuotationAndStatuses(quotation.getId(), OPEN)) {
            if (reEdit != null) {
                job.setQuotationId(reEdit.getId());
            } else {
                job.setStatus(QuotationJob.CANCELLED);
            }
            jobRepository.save(job);
        }
    }

    /** The reopening of this quotation is over (it is Completed or Approved again): its approved requests are done. */
    public void editsDone(Long quotationId) {
        LocalDateTime now = LocalDateTime.now();
        for (QuotationEditRequest r : editRequestRepository.findByQuotationIdAndStatus(quotationId, QuotationEditRequest.APPROVED)) {
            r.setStatus(QuotationEditRequest.DONE);
            if (r.getRequesterSeenAt() == null) {
                r.setRequesterSeenAt(now);
            }
            editRequestRepository.save(r);
        }
    }

    /** The words added to a reply when the customer moved back. */
    public static String movedBack(String customerName) {
        return customerName == null ? "" : "; " + customerName + " moved to Quotation Stage";
    }

    /**
     * The earlier versions this quotation is the re-edit of: drafts in its folder, older than it,
     * that a request reopened before it was made. A version that existed before the reopening is not one.
     */
    private Set<Long> reEditedBy(Quotation quotation) {
        Set<Long> out = new LinkedHashSet<>();
        if (quotation.getFolder() == null || quotation.getCreatedAt() == null) {
            return out;
        }
        for (Quotation older : quotationRepository.findByFolderIdOrderByVersionNumberDesc(quotation.getFolder().getId())) {
            if (older.getId() >= quotation.getId() || older.getStatus() != QuotationStatus.DRAFT) {
                continue;
            }
            boolean reopenedBefore = editRequestRepository.findByQuotationIdAndStatus(older.getId(), QuotationEditRequest.APPROVED).stream()
                    .anyMatch(r -> r.getDecidedAt() != null && !r.getDecidedAt().isAfter(quotation.getCreatedAt()));
            if (reopenedBefore) {
                out.add(older.getId());
            }
        }
        return out;
    }

    private void reopenWork(Quotation quotation, Long byUserId, String by, String note) {
        Long customerId = quotation.getCustomer().getId();
        // Taken in turn per customer, so work handed out at the same moment cannot make a second piece.
        customerRepository.findByIdForUpdate(customerId);
        if (!jobRepository.findByCustomerAndStatuses(customerId, OPEN).isEmpty()) {
            return;
        }
        List<QuotationJob> linked = jobRepository.findByQuotationAndStatuses(quotation.getId(), Set.of(QuotationJob.COMPLETED));
        // Whoever handed it in; for one never handed in on the board, whoever last prepared one for the customer there.
        QuotationJob job = !linked.isEmpty() ? linked.get(0)
                : jobRepository.findByCustomerAndStatuses(customerId, Set.of(QuotationJob.COMPLETED)).stream()
                        .max(Comparator.comparing(QuotationJob::getId)).orElse(null);
        if (job == null) {
            return;
        }
        User assignee = userRepository.findById(job.getAssigneeUserId()).orElse(null);
        if (assignee == null || Boolean.FALSE.equals(assignee.getActive())) {
            return;
        }
        // Counted before the work joins the list again.
        int first = jobRepository.findByAssigneeAndStatuses(assignee.getId(), OPEN).stream()
                .map(QuotationJob::getQueuePosition).filter(Objects::nonNull).min(Integer::compare).orElse(1) - 1;
        if (linked.isEmpty()) {
            QuotationJob fresh = new QuotationJob();
            fresh.setCustomer(job.getCustomer());
            fresh.setAssigneeUserId(assignee.getId());
            fresh.setAssigneeName(assignee.getName());
            fresh.setPriority("MEDIUM");
            fresh.setQuotationId(quotation.getId());
            fresh.setAssignedByUserId(byUserId);
            fresh.setAssignedByName(by);
            fresh.setAssignedAt(LocalDateTime.now());
            job = fresh;
        }
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
        job.setAssigneeSeenAt(assignee.getId().equals(byUserId) ? LocalDateTime.now() : null);
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
