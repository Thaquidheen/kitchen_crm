package com.fleetmanagement.kitchencrmbackend.modules.quotation.editrequest;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Requests to reopen a completed quotation. Staff who may not change a quotation's status ask;
 * the admin approves (the quotation goes back to Draft) or refuses. Rows carry no amounts.
 */
@Service
@Transactional
public class QuotationEditRequestService {

    /** Answered requests stay in the lists for this long. */
    private static final int RECENT_DAYS = 14;
    /** A reopened quotation is offered "Mark completed" for this long. */
    private static final int REOPENED_DAYS = 90;

    @Autowired
    private QuotationEditRequestRepository repository;
    @Autowired
    private QuotationRepository quotationRepository;

    public ApiResponse<Map<String, Object>> request(Long quotationId, String reason, Long userId, String userName) {
        Quotation quotation = quotationId == null ? null : quotationRepository.findById(quotationId).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }
        if (quotation.getStatus() != QuotationStatus.COMPLETE) {
            return ApiResponse.error(quotation.getStatus() == QuotationStatus.DRAFT
                    ? "This quotation is a draft: it can be edited as it is"
                    : "Only a completed quotation can be reopened this way");
        }
        List<QuotationEditRequest> open = repository.findByQuotationIdAndStatus(quotationId, QuotationEditRequest.PENDING);
        if (!open.isEmpty()) {
            String who = open.get(0).getRequestedByName();
            return ApiResponse.error((who == null ? "Someone" : who)
                    + " has already asked to edit this quotation. The admin has not answered yet");
        }
        QuotationEditRequest row = new QuotationEditRequest();
        row.setQuotationId(quotationId);
        row.setRequestedByUserId(userId);
        row.setRequestedByName(userName);
        row.setReason(cut(reason));
        row.setStatus(QuotationEditRequest.PENDING);
        row = repository.save(row);
        return ApiResponse.success("Sent to the admin for approval", toRow(row, quotation, userId));
    }

    /** The admin: everything open, then what was answered lately. Anyone else: their own. */
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> list(Long userId, boolean admin) {
        LocalDateTime since = LocalDateTime.now().minusDays(RECENT_DAYS);
        List<QuotationEditRequest> rows = new ArrayList<>();
        if (admin) {
            rows.addAll(repository.findByStatusOrderByIdDesc(QuotationEditRequest.PENDING));
            rows.addAll(repository.findByStatusNotAndDecidedAtAfterOrderByDecidedAtDesc(QuotationEditRequest.PENDING, since));
        } else if (userId != null) {
            rows.addAll(repository.findByRequestedByUserIdAndCreatedAtAfterOrderByIdDesc(userId, since));
        }
        return ApiResponse.success(toRows(rows, userId));
    }

    /**
     * What the lists show next to a quotation: PENDING = a request is waiting for the admin,
     * REOPENED = the admin approved one and the quotation is still the draft that came of it.
     */
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> pending(Long userId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (QuotationEditRequest r : repository.findByStatusOrderByIdDesc(QuotationEditRequest.PENDING)) {
            out.add(marker(r, "PENDING", userId));
        }
        LocalDateTime since = LocalDateTime.now().minusDays(REOPENED_DAYS);
        for (QuotationEditRequest r : repository.findByStatusAndDecidedAtAfterOrderByIdDesc(QuotationEditRequest.APPROVED, since)) {
            Quotation q = quotationRepository.findById(r.getQuotationId()).orElse(null);
            if (q != null && q.getStatus() == QuotationStatus.DRAFT) {
                out.add(marker(r, "REOPENED", userId));
            }
        }
        return ApiResponse.success(out);
    }

    private static Map<String, Object> marker(QuotationEditRequest r, String state, Long userId) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", r.getId());
        row.put("quotationId", r.getQuotationId());
        row.put("state", state);
        row.put("requestedByName", r.getRequestedByName());
        row.put("mine", userId != null && userId.equals(r.getRequestedByUserId()));
        // What to change travels with the quotation: why it was asked, and the admin's note on
        // approving it (shown where the quotation is edited). Words only, no amounts.
        row.put("reason", r.getReason());
        row.put("decisionNote", r.getDecisionNote());
        row.put("decidedByName", r.getDecidedByName());
        return row;
    }

    /**
     * The quotation was reopened through a request and has been edited: it is Completed again.
     * This is how staff without the "Change status" permission hand it back.
     */
    public ApiResponse<Map<String, Object>> finish(Long quotationId, Long userId) {
        Quotation quotation = quotationId == null ? null : quotationRepository.findById(quotationId).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }
        List<QuotationEditRequest> open = repository.findByQuotationIdAndStatus(quotationId, QuotationEditRequest.APPROVED);
        if (open.isEmpty()) {
            return ApiResponse.error("This quotation was not reopened for editing");
        }
        if (quotation.getStatus() != QuotationStatus.DRAFT) {
            return ApiResponse.error("This quotation is no longer a draft");
        }
        quotation.setStatus(QuotationStatus.COMPLETE);
        quotationRepository.save(quotation);
        LocalDateTime now = LocalDateTime.now();
        for (QuotationEditRequest r : open) {
            r.setStatus(QuotationEditRequest.DONE);
            if (r.getRequesterSeenAt() == null) {
                r.setRequesterSeenAt(now);
            }
            repository.save(r);
        }
        return ApiResponse.success("Quotation completed", toRow(open.get(0), quotation, userId));
    }

    public ApiResponse<Map<String, Object>> decide(Long id, boolean approve, String note, Long adminId, String adminName) {
        QuotationEditRequest row = repository.findById(id).orElse(null);
        if (row == null) {
            return ApiResponse.error("Request not found");
        }
        if (!QuotationEditRequest.PENDING.equals(row.getStatus())) {
            return ApiResponse.error("This request has already been answered");
        }
        Quotation quotation = quotationRepository.findById(row.getQuotationId()).orElse(null);
        if (approve) {
            if (quotation == null) {
                return ApiResponse.error("That quotation no longer exists. Refuse the request to clear it");
            }
            if (quotation.getStatus() == QuotationStatus.COMPLETE) {
                quotation.setStatus(QuotationStatus.DRAFT);
                quotationRepository.save(quotation);
            } else if (quotation.getStatus() != QuotationStatus.DRAFT) {
                return ApiResponse.error("That quotation is no longer Completed. Refuse the request, or change its status first");
            }
        }
        row.setStatus(approve ? QuotationEditRequest.APPROVED : QuotationEditRequest.REFUSED);
        row.setDecidedByUserId(adminId);
        row.setDecidedByName(adminName);
        row.setDecidedAt(LocalDateTime.now());
        row.setDecisionNote(cut(note));
        row.setRequesterSeenAt(null);
        row = repository.save(row);
        return ApiResponse.success(approve ? "Approved: the quotation is a draft again" : "Refused",
                toRow(row, quotation, adminId));
    }

    /**
     * The quotation got another status together with its customer (approved or cancelled): a
     * request still waiting on it has nothing left to ask for.
     */
    public void closeFor(Long quotationId, String why) {
        for (QuotationEditRequest r : repository.findByQuotationIdAndStatus(quotationId, QuotationEditRequest.PENDING)) {
            r.setStatus(QuotationEditRequest.REFUSED);
            r.setDecidedAt(LocalDateTime.now());
            r.setDecisionNote(cut(why));
            r.setRequesterSeenAt(null);
            repository.save(r);
        }
    }

    /** The quotation itself was deleted: its requests, answered or not, have nothing left to point at. */
    public void quotationDeleted(Long quotationId) {
        repository.deleteByQuotationId(quotationId);
    }

    /**
     * Someone with the "Change status" permission set the quotation's status by hand. Putting it
     * back to Draft is what a waiting request asked for; any other status than Completed leaves
     * nothing to ask for.
     */
    public void statusSetByHand(Long quotationId, QuotationStatus newStatus, String by) {
        if (newStatus == QuotationStatus.COMPLETE) {
            return;
        }
        if (newStatus != QuotationStatus.DRAFT) {
            closeFor(quotationId, "The quotation's status was changed");
            return;
        }
        for (QuotationEditRequest r : repository.findByQuotationIdAndStatus(quotationId, QuotationEditRequest.PENDING)) {
            r.setStatus(QuotationEditRequest.APPROVED);
            r.setDecidedByName(by);
            r.setDecidedAt(LocalDateTime.now());
            r.setRequesterSeenAt(null);
            repository.save(r);
        }
    }

    /** The bell: for the admin what waits for an answer, for anyone else answers not seen yet. */
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> feed(Long userId, boolean admin) {
        List<QuotationEditRequest> rows = new ArrayList<>();
        if (admin) {
            rows.addAll(repository.findByStatusOrderByIdDesc(QuotationEditRequest.PENDING));
        } else {
            rows.addAll(unseenAnswers(userId));
        }
        List<Map<String, Object>> items = toRows(rows, userId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", items.size());
        payload.put("items", items);
        return ApiResponse.success(payload);
    }

    /** The person has looked at their answers. */
    public ApiResponse<Integer> markSeen(Long userId) {
        List<QuotationEditRequest> unseen = unseenAnswers(userId);
        for (QuotationEditRequest r : unseen) {
            r.setRequesterSeenAt(LocalDateTime.now());
            repository.save(r);
        }
        return ApiResponse.success(unseen.size());
    }

    private List<QuotationEditRequest> unseenAnswers(Long userId) {
        List<QuotationEditRequest> out = new ArrayList<>();
        if (userId == null) {
            return out;
        }
        LocalDateTime since = LocalDateTime.now().minusDays(RECENT_DAYS);
        for (QuotationEditRequest r : repository.findByRequestedByUserIdAndCreatedAtAfterOrderByIdDesc(userId, since)) {
            if (!QuotationEditRequest.PENDING.equals(r.getStatus()) && r.getRequesterSeenAt() == null) {
                out.add(r);
            }
        }
        return out;
    }

    private List<Map<String, Object>> toRows(List<QuotationEditRequest> rows, Long viewerId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (QuotationEditRequest r : rows) {
            Quotation q = quotationRepository.findById(r.getQuotationId()).orElse(null);
            if (q == null && QuotationEditRequest.PENDING.equals(r.getStatus())) {
                continue; // the quotation was deleted: nothing left to decide
            }
            out.add(toRow(r, q, viewerId));
        }
        return out;
    }

    private static Map<String, Object> toRow(QuotationEditRequest r, Quotation q, Long viewerId) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", r.getId());
        row.put("quotationId", r.getQuotationId());
        row.put("quotationNumber", q == null ? null : q.getQuotationNumber());
        row.put("projectName", q == null ? null : q.getProjectName());
        row.put("versionNumber", q == null ? null : q.getVersionNumber());
        row.put("quotationStatus", q == null || q.getStatus() == null ? null : q.getStatus().name());
        row.put("customerId", q == null || q.getCustomer() == null ? null : q.getCustomer().getId());
        row.put("customerName", q == null || q.getCustomer() == null ? null : q.getCustomer().getName());
        row.put("requestedByName", r.getRequestedByName());
        row.put("mine", viewerId != null && viewerId.equals(r.getRequestedByUserId()));
        row.put("reason", r.getReason());
        row.put("status", r.getStatus());
        row.put("decidedByName", r.getDecidedByName());
        row.put("decidedAt", r.getDecidedAt());
        row.put("decisionNote", r.getDecisionNote());
        row.put("createdAt", r.getCreatedAt());
        return row;
    }

    private static String cut(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        String t = s.trim();
        return t.length() > 500 ? t.substring(0, 500) : t;
    }
}
