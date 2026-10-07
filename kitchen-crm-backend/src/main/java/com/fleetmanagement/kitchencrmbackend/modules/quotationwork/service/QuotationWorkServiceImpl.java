package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.Role;
import com.fleetmanagement.kitchencrmbackend.modules.auth.entity.User;
import com.fleetmanagement.kitchencrmbackend.modules.auth.repository.UserRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.Quotation.QuotationStatus;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity.QuotationJob;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.repository.QuotationJobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class QuotationWorkServiceImpl implements QuotationWorkService {

    private static final String STAFF_TYPE_ADMIN_STAFF = "ADMIN_STAFF";
    private static final Set<String> OPEN = Set.of(QuotationJob.WAITING, QuotationJob.IN_PROGRESS);
    private static final Set<String> PRIORITIES = Set.of("LOW", "MEDIUM", "HIGH", "URGENT");
    private static final Map<String, String> PRIORITY_LABEL =
            Map.of("LOW", "Low", "MEDIUM", "Medium", "HIGH", "High", "URGENT", "Urgent");
    /** Completed work stays on the board, and in the bell while unseen, for this long. */
    private static final int COMPLETED_DAYS = 14;
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);

    /** Queue order: explicit position first (nulls last), then oldest assignment. */
    private static final Comparator<QuotationJob> QUEUE_ORDER = Comparator
            .comparing((QuotationJob j) -> j.getQueuePosition() == null ? Integer.MAX_VALUE : j.getQueuePosition())
            .thenComparing(QuotationJob::getAssignedAt)
            .thenComparing(QuotationJob::getId);

    @Autowired
    private QuotationJobRepository jobRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private QuotationRepository quotationRepository;

    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private LocalDate today() {
        return LocalDate.now(ZoneId.of(businessTimezone));
    }

    // ------------------------------------------------------------------ who

    @Override
    @Transactional(readOnly = true)
    public boolean isCoordinator(Long userId) {
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        return user != null && isActive(user) && STAFF_TYPE_ADMIN_STAFF.equals(user.getStaffType());
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationWorkMeDto me(Viewer viewer) {
        QuotationWorkMeDto dto = new QuotationWorkMeDto();
        dto.setUserId(viewer.id());
        dto.setCanManage(viewer.manages());
        dto.setOpenCount(viewer.id() == null ? 0 : jobRepository.findByAssigneeAndStatuses(viewer.id(), OPEN).size());
        return dto;
    }

    // ------------------------------------------------------------------ reads

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<QuotationJobDto>> list(Viewer viewer) {
        List<QuotationJob> open = jobRepository.findByStatuses(OPEN);
        List<QuotationJob> completed = recentlyCompleted();
        if (!viewer.manages()) {
            open = open.stream().filter(j -> isAssignee(j, viewer)).toList();
            completed = completed.stream().filter(j -> isAssignee(j, viewer)).toList();
        }
        List<QuotationJob> jobs = new ArrayList<>(open.stream()
                .sorted(Comparator.comparing(QuotationJob::getAssigneeUserId).thenComparing(QUEUE_ORDER))
                .toList());
        jobs.addAll(completed.stream()
                .sorted(Comparator.comparing(QuotationJob::getCompletedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList());
        return ApiResponse.success(toDtos(jobs, viewer));
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<Map<String, Object>>> unassigned() {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Customer c : jobRepository.findCustomersWithoutQuotationWork(CustomerStatus.QUOTE_GIVEN)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("customerId", c.getId());
            row.put("customerName", c.getName());
            row.put("customerPlace", c.getPlace());
            rows.add(row);
        }
        return ApiResponse.success(rows);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<List<QuotationAssigneeDto>> assignees() {
        LocalDate today = today();
        Map<Long, List<QuotationJob>> openByUser = jobRepository.findByStatuses(OPEN).stream()
                .collect(Collectors.groupingBy(QuotationJob::getAssigneeUserId));
        List<QuotationAssigneeDto> out = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            if (!isActive(u)) {
                continue;
            }
            List<QuotationJob> mine = openByUser.getOrDefault(u.getId(), List.of());
            QuotationAssigneeDto dto = new QuotationAssigneeDto();
            dto.setId(u.getId());
            dto.setName(u.getName());
            dto.setStaffType(isSuperAdmin(u) ? "ADMIN" : u.getStaffType());
            dto.setOpenCount(mine.size());
            dto.setOverdue((int) mine.stream().filter(j -> isOverdue(j, today)).count());
            out.add(dto);
        }
        out.sort(Comparator.comparing(d -> d.getName() == null ? "" : d.getName().toLowerCase()));
        return ApiResponse.success(out);
    }

    // ------------------------------------------------------------------ managing

    @Override
    public ApiResponse<QuotationJobDto> assign(QuotationJobAssignRequest request, Viewer viewer) {
        Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
        if (assignee == null || !isActive(assignee)) {
            return ApiResponse.error("Choose an active staff member");
        }
        String priority = normalizePriority(request.getPriority());
        if (hasText(request.getPriority()) && priority == null) {
            return ApiResponse.error("Priority must be Low, Medium, High or Urgent");
        }
        List<QuotationJob> existing = jobRepository.findByCustomerAndStatuses(customer.getId(), OPEN);
        if (!existing.isEmpty()) {
            return ApiResponse.error(nameOf(existing.get(0)) + " is already preparing this customer's quotation");
        }
        QuotationJob job = new QuotationJob();
        job.setCustomer(customer);
        job.setAssigneeUserId(assignee.getId());
        job.setAssigneeName(assignee.getName());
        job.setStatus(QuotationJob.WAITING);
        job.setPriority(priority == null ? "MEDIUM" : priority);
        job.setDueDate(request.getDueDate());
        job.setNote(trimToNull(request.getNote()));
        job.setQueuePosition(endOfQueue(assignee.getId()));
        job.setAssignedByUserId(viewer.id());
        job.setAssignedByName(viewer.name());
        job.setAssignedAt(LocalDateTime.now());
        // Giving yourself work is not news to you.
        job.setAssigneeSeenAt(assignee.getId().equals(viewer.id()) ? LocalDateTime.now() : null);
        job = jobRepository.save(job);
        return ApiResponse.success("Quotation assigned to " + assignee.getName(), toDto(job, viewer));
    }

    @Override
    public ApiResponse<QuotationJobDto> update(Long jobId, QuotationJobUpdateRequest request, Viewer viewer) {
        QuotationJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ApiResponse.error("Quotation work not found");
        }
        if (!OPEN.contains(job.getStatus())) {
            return ApiResponse.error("This quotation work is already closed");
        }
        String priority = normalizePriority(request.getPriority());
        if (hasText(request.getPriority()) && priority == null) {
            return ApiResponse.error("Priority must be Low, Medium, High or Urgent");
        }

        boolean reassigned = request.getAssigneeId() != null && !request.getAssigneeId().equals(job.getAssigneeUserId());
        if (reassigned) {
            User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            if (assignee == null || !isActive(assignee)) {
                return ApiResponse.error("Choose an active staff member");
            }
            // Counted before the job joins that queue, or it would be measured against itself.
            int position = endOfQueue(assignee.getId());
            job.setAssigneeUserId(assignee.getId());
            job.setAssigneeName(assignee.getName());
            job.setQueuePosition(position);
            // The new person has not started anything.
            job.setStatus(QuotationJob.WAITING);
            job.setStartedAt(null);
            job.setAssignedByUserId(viewer.id());
            job.setAssignedByName(viewer.name());
            job.setAssignedAt(LocalDateTime.now());
        }

        List<String> news = new ArrayList<>();
        if (priority != null && !priority.equals(priorityOf(job))) {
            job.setPriority(priority);
            news.add("Priority changed to " + PRIORITY_LABEL.get(priority));
        }
        if (Boolean.TRUE.equals(request.getClearDueDate())) {
            if (job.getDueDate() != null) {
                job.setDueDate(null);
                news.add("Due date removed");
            }
        } else if (request.getDueDate() != null && !request.getDueDate().equals(job.getDueDate())) {
            job.setDueDate(request.getDueDate());
            news.add("Due " + request.getDueDate().format(DAY));
        }
        if (request.getNote() != null && !Objects.equals(trimToNull(request.getNote()), job.getNote())) {
            job.setNote(trimToNull(request.getNote()));
            news.add("Note updated");
        }

        boolean ownWork = job.getAssigneeUserId().equals(viewer.id());
        if (reassigned) {
            // To the new person this is simply new work.
            job.setAssigneeNews(null);
            job.setAssigneeSeenAt(ownWork ? LocalDateTime.now() : null);
        } else if (!news.isEmpty() && !ownWork) {
            job.setAssigneeNews(cut(String.join(" · ", news)));
            job.setAssigneeSeenAt(null);
        }
        job = jobRepository.save(job);
        return ApiResponse.success("Saved", toDto(job, viewer));
    }

    @Override
    public ApiResponse<List<QuotationJobDto>> reorder(QuotationJobReorderRequest request, Viewer viewer) {
        List<QuotationJob> jobs = jobRepository.findByAssigneeAndStatuses(request.getAssigneeId(), OPEN);
        Long firstBefore = jobs.stream().min(QUEUE_ORDER).map(QuotationJob::getId).orElse(null);
        Map<Long, QuotationJob> byId = jobs.stream().collect(Collectors.toMap(QuotationJob::getId, j -> j));
        int position = 1;
        Set<Long> placed = new HashSet<>();
        for (Long id : request.getJobIds() == null ? List.<Long>of() : request.getJobIds()) {
            QuotationJob job = byId.get(id);
            if (job == null || !placed.add(id)) {
                continue;
            }
            job.setQueuePosition(position++);
        }
        // Jobs the request did not mention keep their relative order after the ones it did.
        List<QuotationJob> rest = jobs.stream().filter(j -> !placed.contains(j.getId())).sorted(QUEUE_ORDER).toList();
        for (QuotationJob job : rest) {
            job.setQueuePosition(position++);
        }
        List<QuotationJob> ordered = jobs.stream().sorted(QUEUE_ORDER).toList();
        // Tell the person when a different quotation is now the one to do first.
        if (ordered.size() > 1 && !ordered.get(0).getId().equals(firstBefore)
                && !request.getAssigneeId().equals(viewer.id())) {
            QuotationJob first = ordered.get(0);
            first.setAssigneeNews("Now first in your list");
            first.setAssigneeSeenAt(null);
        }
        jobRepository.saveAll(jobs);
        return ApiResponse.success("Order saved", toDtos(ordered, viewer));
    }

    @Override
    public ApiResponse<QuotationJobDto> cancel(Long jobId, Viewer viewer) {
        QuotationJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ApiResponse.error("Quotation work not found");
        }
        if (!OPEN.contains(job.getStatus())) {
            return ApiResponse.error("This quotation work is already closed");
        }
        job.setStatus(QuotationJob.CANCELLED);
        job = jobRepository.save(job);
        return ApiResponse.success("Removed from the board", toDto(job, viewer));
    }

    // ------------------------------------------------------------------ doing the work

    @Override
    public ApiResponse<QuotationJobDto> start(Long jobId, Viewer viewer) {
        QuotationJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !canWorkOn(job, viewer)) {
            return ApiResponse.error("Quotation work not found");
        }
        if (!OPEN.contains(job.getStatus())) {
            return ApiResponse.error("This quotation work is already closed");
        }
        if (QuotationJob.WAITING.equals(job.getStatus())) {
            job.setStatus(QuotationJob.IN_PROGRESS);
            job.setStartedAt(LocalDateTime.now());
        }
        if (isAssignee(job, viewer) && job.getAssigneeSeenAt() == null) {
            job.setAssigneeSeenAt(LocalDateTime.now());
        }
        job = jobRepository.save(job);
        return ApiResponse.success("Started", toDto(job, viewer));
    }

    @Override
    public ApiResponse<QuotationJobDto> complete(Long jobId, QuotationJobCompleteRequest request, Viewer viewer) {
        QuotationJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null || !canWorkOn(job, viewer)) {
            return ApiResponse.error("Quotation work not found");
        }
        if (!OPEN.contains(job.getStatus())) {
            return ApiResponse.error("This quotation work is already closed");
        }
        Long customerId = job.getCustomer().getId();
        Quotation quotation;
        if (request != null && request.getQuotationId() != null) {
            quotation = quotationRepository.findById(request.getQuotationId()).orElse(null);
            if (quotation == null || !quotation.getCustomer().getId().equals(customerId)) {
                return ApiResponse.error("That quotation does not belong to this customer");
            }
        } else {
            // Newest quotation of the customer.
            quotation = quotationRepository.findByCustomerId(customerId).stream()
                    .max(Comparator.comparing(Quotation::getId)).orElse(null);
            if (quotation == null) {
                return ApiResponse.error("Create the quotation for this customer first");
            }
        }
        if (quotation.getStatus() == QuotationStatus.CANCELLED) {
            return ApiResponse.error("That quotation is cancelled. Choose another one");
        }
        // The quotation itself reads Completed in the list. Only a draft is touched: On Hold and
        // Approved were set by the admin on purpose.
        if (quotation.getStatus() == null || quotation.getStatus() == QuotationStatus.DRAFT) {
            quotation.setStatus(QuotationStatus.COMPLETE);
            quotationRepository.save(quotation);
        }
        LocalDateTime now = LocalDateTime.now();
        job.setStatus(QuotationJob.COMPLETED);
        job.setCompletedAt(now);
        job.setCompletedByUserId(viewer.id());
        job.setCompletedByName(viewer.name());
        job.setQuotationId(quotation.getId());
        if (job.getStartedAt() == null) {
            job.setStartedAt(now);
        }
        if (job.getAssigneeSeenAt() == null) {
            job.setAssigneeSeenAt(now);
        }
        // Whoever completes it does not need to be told.
        if (viewer.superAdmin()) {
            job.setAdminSeenAt(now);
        } else if (viewer.coordinator()) {
            job.setCoordinatorSeenAt(now);
        }
        job = jobRepository.save(job);
        return ApiResponse.success("Quotation completed", toDto(job, viewer));
    }

    // ------------------------------------------------------------------ bell

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<Map<String, Object>> feed(Viewer viewer) {
        LocalDate today = today();
        List<QuotationJob> open = jobRepository.findByStatuses(OPEN);
        Map<Long, String> kinds = new LinkedHashMap<>();
        List<QuotationJob> picked = new ArrayList<>();

        // My own work: new, changed by the admin, or late.
        for (QuotationJob j : open.stream().filter(j -> isAssignee(j, viewer)).sorted(QUEUE_ORDER).toList()) {
            String kind = j.getAssigneeSeenAt() == null
                    ? (hasText(j.getAssigneeNews()) ? "CHANGED" : "NEW")
                    : isOverdue(j, today) ? "OVERDUE" : null;
            if (kind != null && kinds.putIfAbsent(j.getId(), kind) == null) {
                picked.add(j);
            }
        }
        if (viewer.manages()) {
            // Work somebody else completed that I have not looked at yet.
            for (QuotationJob j : recentlyCompleted()) {
                if (unseenCompletion(j, viewer) && kinds.putIfAbsent(j.getId(), "COMPLETED") == null) {
                    picked.add(j);
                }
            }
            // Other people's late work.
            for (QuotationJob j : open) {
                if (!isAssignee(j, viewer) && isOverdue(j, today) && kinds.putIfAbsent(j.getId(), "OVERDUE") == null) {
                    picked.add(j);
                }
            }
        }
        List<QuotationJobDto> dtos = toDtos(picked, viewer);
        for (QuotationJobDto dto : dtos) {
            dto.setFeedKind(kinds.get(dto.getId()));
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", dtos.size());
        payload.put("jobs", dtos);
        return ApiResponse.success(payload);
    }

    @Override
    public ApiResponse<Integer> markSeen(Viewer viewer) {
        LocalDateTime now = LocalDateTime.now();
        List<QuotationJob> changed = new ArrayList<>();
        if (viewer.id() != null) {
            for (QuotationJob j : jobRepository.findByAssigneeAndStatuses(viewer.id(), OPEN)) {
                if (j.getAssigneeSeenAt() == null) {
                    j.setAssigneeSeenAt(now);
                    changed.add(j);
                }
            }
        }
        if (viewer.manages()) {
            for (QuotationJob j : recentlyCompleted()) {
                if (viewer.superAdmin() && j.getAdminSeenAt() == null) {
                    j.setAdminSeenAt(now);
                    changed.add(j);
                } else if (!viewer.superAdmin() && j.getCoordinatorSeenAt() == null) {
                    j.setCoordinatorSeenAt(now);
                    changed.add(j);
                }
            }
        }
        jobRepository.saveAll(changed);
        return ApiResponse.success(changed.size());
    }

    // ------------------------------------------------------------------ helpers

    private List<QuotationJob> recentlyCompleted() {
        return jobRepository.findCompletedSince(LocalDateTime.now().minusDays(COMPLETED_DAYS));
    }

    private static boolean isActive(User u) {
        return !Boolean.FALSE.equals(u.getActive());
    }

    private static boolean isSuperAdmin(User u) {
        return u.getRoles() != null && u.getRoles().stream().anyMatch(r -> r.getName() == Role.RoleName.ROLE_SUPER_ADMIN);
    }

    private static boolean isAssignee(QuotationJob job, Viewer viewer) {
        return viewer.id() != null && viewer.id().equals(job.getAssigneeUserId());
    }

    private static boolean canWorkOn(QuotationJob job, Viewer viewer) {
        return viewer.manages() || isAssignee(job, viewer);
    }

    private static boolean isOverdue(QuotationJob j, LocalDate today) {
        return OPEN.contains(j.getStatus()) && j.getDueDate() != null && j.getDueDate().isBefore(today);
    }

    /** Completed by somebody else and not yet looked at by this side of the board. */
    private static boolean unseenCompletion(QuotationJob j, Viewer viewer) {
        if (!QuotationJob.COMPLETED.equals(j.getStatus()) || !viewer.manages()) {
            return false;
        }
        if (viewer.id() != null && viewer.id().equals(j.getCompletedByUserId())) {
            return false;
        }
        return viewer.superAdmin() ? j.getAdminSeenAt() == null : j.getCoordinatorSeenAt() == null;
    }

    private static String priorityOf(QuotationJob j) {
        return j.getPriority() == null ? "MEDIUM" : j.getPriority();
    }

    private static String nameOf(QuotationJob j) {
        return hasText(j.getAssigneeName()) ? j.getAssigneeName() : "Someone";
    }

    private static String normalizePriority(String raw) {
        if (!hasText(raw)) {
            return null;
        }
        String v = raw.trim().toUpperCase();
        return PRIORITIES.contains(v) ? v : null;
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToNull(String s) {
        return hasText(s) ? s.trim() : null;
    }

    private static String cut(String s) {
        return s.length() > 255 ? s.substring(0, 255) : s;
    }

    /** Position after the last open job of that person. */
    private int endOfQueue(Long assigneeId) {
        return jobRepository.findByAssigneeAndStatuses(assigneeId, OPEN).stream()
                .map(QuotationJob::getQueuePosition).filter(Objects::nonNull).max(Integer::compare).orElse(0) + 1;
    }

    private QuotationJobDto toDto(QuotationJob job, Viewer viewer) {
        return toDtos(List.of(job), viewer).get(0);
    }

    private List<QuotationJobDto> toDtos(List<QuotationJob> jobs, Viewer viewer) {
        if (jobs.isEmpty()) {
            return new ArrayList<>();
        }
        LocalDate today = today();
        // Place in each person's queue, counted over all their open work.
        Map<Long, Integer> positions = new HashMap<>();
        jobRepository.findByStatuses(OPEN).stream()
                .collect(Collectors.groupingBy(QuotationJob::getAssigneeUserId))
                .values().forEach(queue -> {
                    int n = 1;
                    for (QuotationJob j : queue.stream().sorted(QUEUE_ORDER).toList()) {
                        positions.put(j.getId(), n++);
                    }
                });
        Set<Long> customerIds = jobs.stream().map(j -> j.getCustomer().getId()).collect(Collectors.toSet());
        Map<Long, List<QuotationRefDto>> quotationsByCustomer = new HashMap<>();
        for (Object[] row : jobRepository.findQuotationsOfCustomers(customerIds)) {
            QuotationRefDto ref = new QuotationRefDto();
            ref.setId((Long) row[1]);
            ref.setQuotationNumber((String) row[2]);
            ref.setProjectName((String) row[3]);
            ref.setVersionNumber((Integer) row[4]);
            ref.setStatus(row[5] == null ? null : row[5].toString());
            ref.setCreatedAt((LocalDateTime) row[6]);
            quotationsByCustomer.computeIfAbsent((Long) row[0], k -> new ArrayList<>()).add(ref);
        }

        List<QuotationJobDto> out = new ArrayList<>();
        for (QuotationJob j : jobs) {
            Customer c = j.getCustomer();
            boolean open = OPEN.contains(j.getStatus());
            List<QuotationRefDto> quotations = quotationsByCustomer.getOrDefault(c.getId(), List.of());
            QuotationJobDto dto = new QuotationJobDto();
            dto.setId(j.getId());
            dto.setCustomerId(c.getId());
            dto.setCustomerName(c.getName());
            dto.setCustomerPlace(c.getPlace());
            dto.setCustomerStatus(c.getStatus() == null ? null : c.getStatus().name());
            dto.setAssigneeId(j.getAssigneeUserId());
            dto.setAssigneeName(j.getAssigneeName());
            dto.setStatus(j.getStatus());
            dto.setPriority(priorityOf(j));
            dto.setDueDate(j.getDueDate());
            dto.setOverdue(isOverdue(j, today));
            dto.setNote(j.getNote());
            dto.setPosition(open ? positions.get(j.getId()) : null);
            dto.setAssignedByName(j.getAssignedByName());
            dto.setAssignedAt(j.getAssignedAt());
            dto.setStartedAt(j.getStartedAt());
            dto.setCompletedAt(j.getCompletedAt());
            dto.setCompletedByName(j.getCompletedByName());
            if (open) {
                dto.setCustomerQuotations(quotations);
            } else if (j.getQuotationId() != null) {
                dto.setQuotation(quotations.stream().filter(q -> q.getId().equals(j.getQuotationId())).findFirst().orElse(null));
            }
            boolean mine = isAssignee(j, viewer);
            dto.setNewForAssignee(open && mine && j.getAssigneeSeenAt() == null);
            dto.setAssigneeNews(open && mine && j.getAssigneeSeenAt() == null ? j.getAssigneeNews() : null);
            dto.setNewlyCompleted(unseenCompletion(j, viewer));
            out.add(dto);
        }
        return out;
    }
}
