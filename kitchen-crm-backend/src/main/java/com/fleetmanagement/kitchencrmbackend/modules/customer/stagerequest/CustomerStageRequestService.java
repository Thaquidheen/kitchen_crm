package com.fleetmanagement.kitchencrmbackend.modules.customer.stagerequest;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.modules.design.service.DesignJobService;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.service.QuotationService;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.service.QuotationWorkStageEffects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Staff ask the admin before moving a Follow Up customer back to Design Stage or Quotation Stage
 * (the owner's rule, 2026-10-29). The admin approves or refuses; approving moves the customer and
 * continues with what they already have:
 * <ul>
 *   <li>Design Stage: an approved design continues as its next version, waiting under To assign for
 *       the admin to choose the designer.</li>
 *   <li>Quotation Stage: the latest completed quotation is reopened as a draft and goes back to
 *       whoever prepared it on the work board (QuotationReopenedEffects); with none, the customer
 *       waits under the board's To assign.</li>
 * </ul>
 * Rows carry no amounts.
 */
@Service
@Transactional
public class CustomerStageRequestService {

    /** Answered requests stay in the lists for this long. */
    private static final int RECENT_DAYS = 14;
    /** What staff may ask for, from Follow Up. */
    public static final Set<CustomerStatus> ASKED_FOR = Set.of(CustomerStatus.DESIGN_STAGE, CustomerStatus.QUOTE_GIVEN);
    /** The words a refused move answers with; the screens send a request when they see them. */
    public static final String NEEDS_APPROVAL = "This move needs the admin's approval: send a request";

    @Autowired
    private CustomerStageRequestRepository repository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;
    @Autowired
    private DesignJobService designJobService;
    @Autowired
    private QuotationRepository quotationRepository;
    @Autowired
    private QuotationService quotationService;
    @Autowired
    private QuotationWorkStageEffects quotationWorkStageEffects;

    /** Whether a move by someone who is not the admin has to be asked for. */
    public static boolean needsApproval(CustomerStatus from, CustomerStatus to) {
        return from == CustomerStatus.FOLLOW_UP && ASKED_FOR.contains(to);
    }

    public ApiResponse<Map<String, Object>> request(Long customerId, String toStage, String reason, Long userId, String userName) {
        Customer customer = customerId == null ? null : customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        CustomerStatus to = parse(toStage);
        if (to == null || !needsApproval(customer.getStatus(), to)) {
            return ApiResponse.error("Only a customer in Follow Up can be asked back to Design Stage or Quotation Stage");
        }
        if (reason == null || reason.isBlank()) {
            return ApiResponse.error("Say why the customer needs to go back");
        }
        if (to == CustomerStatus.QUOTE_GIVEN) {
            String designError = designJobService.requireDesignForQuotationStage(customer);
            if (designError != null) {
                return ApiResponse.error(designError);
            }
        }
        List<CustomerStageRequest> open = repository.findByCustomerIdAndStatus(customerId, CustomerStageRequest.PENDING);
        if (!open.isEmpty()) {
            String who = open.get(0).getRequestedByName();
            return ApiResponse.error((who == null ? "Someone" : who) + " has already asked to move this customer. The admin has not answered yet");
        }
        CustomerStageRequest row = new CustomerStageRequest();
        row.setCustomerId(customerId);
        row.setFromStage(customer.getStatus().name());
        row.setToStage(to.name());
        row.setReason(cut(reason));
        row.setRequestedByUserId(userId);
        row.setRequestedByName(userName);
        row.setStatus(CustomerStageRequest.PENDING);
        row = repository.save(row);
        return ApiResponse.success("Sent to the admin for approval", toRow(row, customer, userId));
    }

    public ApiResponse<Map<String, Object>> decide(Long id, boolean approve, String note, Long adminId, String adminName) {
        CustomerStageRequest row = repository.findById(id).orElse(null);
        if (row == null) {
            return ApiResponse.error("Request not found");
        }
        if (!CustomerStageRequest.PENDING.equals(row.getStatus())) {
            return ApiResponse.error("This request has already been answered");
        }
        Customer customer = customerRepository.findById(row.getCustomerId()).orElse(null);
        String message = "Refused";
        if (approve) {
            if (customer == null) {
                return ApiResponse.error("That customer no longer exists. Refuse the request to clear it");
            }
            CustomerStatus to = parse(row.getToStage());
            if (!needsApproval(customer.getStatus(), to)) {
                return ApiResponse.error("The customer is no longer in Follow Up. Refuse the request");
            }
            String why = (row.getReason() == null ? "Move requested" : row.getReason())
                    + " (asked by " + (row.getRequestedByName() == null ? "staff" : row.getRequestedByName())
                    + (note == null || note.isBlank() ? "" : "; " + note.trim()) + ")";
            Outcome outcome = to == CustomerStatus.DESIGN_STAGE
                    ? backToDesign(customer, why, adminId, adminName)
                    : backToQuotation(customer, why, adminId, adminName);
            if (outcome.error() != null) {
                return ApiResponse.error(outcome.error());
            }
            message = to == CustomerStatus.DESIGN_STAGE
                    ? "Approved: " + customer.getName() + " is in Design Stage; choose the designer under To assign in Designs"
                    : "Approved: " + customer.getName() + " is in Quotation Stage" + outcome.note();
        }
        row.setStatus(approve ? CustomerStageRequest.APPROVED : CustomerStageRequest.REFUSED);
        row.setDecidedByUserId(adminId);
        row.setDecidedByName(adminName);
        row.setDecidedAt(LocalDateTime.now());
        row.setDecisionNote(cut(note));
        row.setRequesterSeenAt(null);
        row = repository.save(row);
        return ApiResponse.success(message, toRow(row, customer, adminId));
    }

    /** What an approved move did: an error (nothing written), or words for the reply. */
    private record Outcome(String error, String note) {
    }

    private Outcome backToDesign(Customer customer, String why, Long adminId, String adminName) {
        designJobService.reopenForRequest(customer, why, adminId);
        move(customer, CustomerStatus.DESIGN_STAGE, adminName, why);
        // A quotation being prepared is for the design being redone.
        quotationWorkStageEffects.customerMoved(customer.getId(), CustomerStatus.DESIGN_STAGE);
        return new Outcome(null, "");
    }

    private Outcome backToQuotation(Customer customer, String why, Long adminId, String adminName) {
        String designError = designJobService.requireDesignForQuotationStage(customer);
        if (designError != null) {
            return new Outcome(designError, null);
        }
        String note = "";
        Quotation latest = quotationRepository.findByCustomerId(customer.getId()).stream()
                .filter(q -> q.getStatus() == QuotationStatus.COMPLETE)
                .max(Comparator.comparing(Quotation::getId)).orElse(null);
        if (latest != null) {
            // Reopening it does the rest: back to whoever prepared it, and the customer to Quotation Stage.
            ApiResponse<String> reopened = quotationService.updateQuotationStatus(latest.getId(), QuotationStatus.DRAFT, adminName, adminId);
            if (!Boolean.TRUE.equals(reopened.getSuccess())) {
                return new Outcome(reopened.getMessage(), null);
            }
            note = "; quotation " + latest.getQuotationNumber() + " is reopened for editing";
        }
        Customer now = customerRepository.findById(customer.getId()).orElse(customer);
        if (now.getStatus() != CustomerStatus.QUOTE_GIVEN) {
            // No completed quotation to reopen: the customer waits under the board's To assign.
            move(now, CustomerStatus.QUOTE_GIVEN, adminName, why);
        }
        return new Outcome(null, note);
    }

    private void move(Customer customer, CustomerStatus to, String by, String why) {
        String previous = customer.getStatus().name();
        customer.setStatus(to);
        customerRepository.save(customer);
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previous);
        history.setNewState(to.name());
        history.setChangedBy(by);
        history.setChangeReason(why);
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);
    }

    /** Whoever asked, or the admin, takes a waiting request back. */
    public ApiResponse<Map<String, Object>> cancel(Long id, Long userId, boolean admin) {
        CustomerStageRequest row = repository.findById(id).orElse(null);
        if (row == null) {
            return ApiResponse.error("Request not found");
        }
        if (!admin && (userId == null || !userId.equals(row.getRequestedByUserId()))) {
            return ApiResponse.error("Only whoever asked, or the admin, can withdraw this request");
        }
        if (!CustomerStageRequest.PENDING.equals(row.getStatus())) {
            return ApiResponse.error("This request has already been answered");
        }
        row.setStatus(CustomerStageRequest.CANCELLED);
        row.setDecidedAt(LocalDateTime.now());
        row.setDecisionNote("Withdrawn");
        row.setRequesterSeenAt(LocalDateTime.now());
        row = repository.save(row);
        return ApiResponse.success("Request withdrawn",
                toRow(row, customerRepository.findById(row.getCustomerId()).orElse(null), userId));
    }

    /** The admin: everything waiting, then what was answered lately. Anyone else: their own. */
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> list(Long userId, boolean admin) {
        LocalDateTime since = LocalDateTime.now().minusDays(RECENT_DAYS);
        List<CustomerStageRequest> rows = new ArrayList<>();
        if (admin) {
            rows.addAll(repository.findByStatusOrderByIdDesc(CustomerStageRequest.PENDING));
            rows.addAll(repository.findByStatusNotAndDecidedAtAfterOrderByDecidedAtDesc(CustomerStageRequest.PENDING, since));
        } else if (userId != null) {
            rows.addAll(repository.findByRequestedByUserIdAndCreatedAtAfterOrderByIdDesc(userId, since));
        }
        return ApiResponse.success(toRows(rows, userId));
    }

    /** The bell: for the admin what waits for an answer, for anyone else answers not seen yet. */
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> feed(Long userId, boolean admin) {
        List<CustomerStageRequest> rows = admin
                ? repository.findByStatusOrderByIdDesc(CustomerStageRequest.PENDING)
                : unseenAnswers(userId);
        List<Map<String, Object>> items = toRows(rows, userId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", items.size());
        payload.put("items", items);
        return ApiResponse.success(payload);
    }

    /** The person has looked at their answers. */
    public ApiResponse<Integer> markSeen(Long userId) {
        List<CustomerStageRequest> unseen = unseenAnswers(userId);
        for (CustomerStageRequest r : unseen) {
            r.setRequesterSeenAt(LocalDateTime.now());
            repository.save(r);
        }
        return ApiResponse.success(unseen.size());
    }

    private List<CustomerStageRequest> unseenAnswers(Long userId) {
        List<CustomerStageRequest> out = new ArrayList<>();
        if (userId == null) {
            return out;
        }
        LocalDateTime since = LocalDateTime.now().minusDays(RECENT_DAYS);
        for (CustomerStageRequest r : repository.findByRequestedByUserIdAndCreatedAtAfterOrderByIdDesc(userId, since)) {
            if (!CustomerStageRequest.PENDING.equals(r.getStatus()) && r.getRequesterSeenAt() == null) {
                out.add(r);
            }
        }
        return out;
    }

    private List<Map<String, Object>> toRows(List<CustomerStageRequest> rows, Long viewerId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (CustomerStageRequest r : rows) {
            Customer c = customerRepository.findById(r.getCustomerId()).orElse(null);
            if (c == null) {
                continue;
            }
            out.add(toRow(r, c, viewerId));
        }
        return out;
    }

    private Map<String, Object> toRow(CustomerStageRequest r, Customer c, Long viewerId) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", r.getId());
        row.put("customerId", r.getCustomerId());
        row.put("customerName", c == null ? null : c.getName());
        row.put("customerStatus", c == null || c.getStatus() == null ? null : c.getStatus().name());
        row.put("fromStage", r.getFromStage());
        row.put("toStage", r.getToStage());
        row.put("reason", r.getReason());
        row.put("status", r.getStatus());
        row.put("requestedByName", r.getRequestedByName());
        row.put("mine", viewerId != null && viewerId.equals(r.getRequestedByUserId()));
        row.put("decidedByName", r.getDecidedByName());
        row.put("decidedAt", r.getDecidedAt());
        row.put("decisionNote", r.getDecisionNote());
        row.put("createdAt", r.getCreatedAt());
        // What approving does to the quotation, in words (no amounts).
        if (CustomerStatus.QUOTE_GIVEN.name().equals(r.getToStage()) && c != null) {
            quotationRepository.findByCustomerId(c.getId()).stream()
                    .filter(q -> q.getStatus() == QuotationStatus.COMPLETE)
                    .max(Comparator.comparing(Quotation::getId))
                    .ifPresent(q -> row.put("reopens", q.getProjectName() != null && !q.getProjectName().isBlank()
                            ? q.getProjectName() + (q.getVersionNumber() != null && q.getVersionNumber() > 1 ? " V" + q.getVersionNumber() : "")
                            : q.getQuotationNumber()));
        }
        return row;
    }

    private static CustomerStatus parse(String s) {
        try {
            return s == null ? null : CustomerStatus.valueOf(s.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String cut(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String t = s.trim();
        return t.length() > 500 ? t.substring(0, 500) : t;
    }
}
