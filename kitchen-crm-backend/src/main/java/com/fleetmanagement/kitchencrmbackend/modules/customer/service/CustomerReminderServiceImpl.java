package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerReminderDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerReminder;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerReminderRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reminders work at DAY granularity: the time of day entered on a reminder is a note for the
 * user, not a trigger. A reminder becomes visible at 00:00 on its own date and stays visible
 * until it is marked done.
 *
 * The server clock is UTC but the business runs on IST, so every "what day is it" decision is
 * taken in the configured business timezone. Without that, a reminder dated tomorrow would only
 * surface at 05:30 IST instead of at midnight.
 */
@Service
@Transactional
public class CustomerReminderServiceImpl implements CustomerReminderService {

    private static final CustomerReminder.ReminderStatus DONE = CustomerReminder.ReminderStatus.DONE;
    private static final List<CustomerReminder.ReminderStatus> OPEN_STATUSES =
            List.of(CustomerReminder.ReminderStatus.PENDING, CustomerReminder.ReminderStatus.DUE);
    // Wide sentinels for an unbounded end of a date range (see CustomerReminderRepository.search)
    private static final LocalDateTime MIN_BOUND = LocalDateTime.of(1900, 1, 1, 0, 0);
    private static final LocalDateTime MAX_BOUND = LocalDateTime.of(2999, 12, 31, 0, 0);

    @Autowired
    private CustomerReminderRepository reminderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Value("${app.business-timezone:Asia/Kolkata}")
    private String businessTimezone;

    private ZoneId zone() {
        return ZoneId.of(businessTimezone);
    }

    /** Today's date in the business timezone, not the server's. */
    private LocalDate today() {
        return LocalDate.now(zone());
    }

    /** 00:00 tomorrow — the exclusive upper bound of "today or earlier". */
    private LocalDateTime startOfTomorrow() {
        return today().plusDays(1).atStartOfDay();
    }

    /** True when the reminder's calendar day has started (i.e. it is dated today or earlier). */
    private boolean isDueByDate(LocalDateTime remindAt) {
        return remindAt.isBefore(startOfTomorrow());
    }

    @Override
    public ApiResponse<CustomerReminderDto> createReminder(CustomerReminderDto dto, String createdBy) {
        Customer customer = customerRepository.findById(dto.getCustomerId()).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        CustomerReminder reminder = new CustomerReminder();
        reminder.setCustomer(customer);
        reminder.setTitle(dto.getTitle());
        reminder.setNotes(dto.getNotes());
        reminder.setRemindAt(dto.getRemindAt());
        // Dated today or earlier => due straight away, whatever time of day was entered.
        boolean dueNow = isDueByDate(dto.getRemindAt());
        reminder.setStatus(dueNow ? CustomerReminder.ReminderStatus.DUE
                : CustomerReminder.ReminderStatus.PENDING);
        if (dueNow) {
            reminder.setNotifiedAt(LocalDateTime.now());
        }
        reminder.setCreatedBy(createdBy);
        return ApiResponse.success("Reminder created", convertToDto(reminderRepository.save(reminder)));
    }

    @Override
    public ApiResponse<CustomerReminderDto> updateReminder(Long id, CustomerReminderDto dto) {
        CustomerReminder reminder = reminderRepository.findById(id).orElse(null);
        if (reminder == null) {
            return ApiResponse.error("Reminder not found");
        }
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) reminder.setTitle(dto.getTitle());
        reminder.setNotes(dto.getNotes());
        if (dto.getRemindAt() != null) {
            reminder.setRemindAt(dto.getRemindAt());
            if (reminder.getStatus() != DONE) {
                if (isDueByDate(dto.getRemindAt())) {
                    // Moved onto today (or earlier): surface it now.
                    if (reminder.getStatus() == CustomerReminder.ReminderStatus.PENDING) {
                        reminder.setStatus(CustomerReminder.ReminderStatus.DUE);
                        reminder.setNotifiedAt(LocalDateTime.now());
                    }
                } else {
                    // Pushed out to a later day: re-arm it.
                    reminder.setStatus(CustomerReminder.ReminderStatus.PENDING);
                    reminder.setNotifiedAt(null);
                }
            }
        }
        return ApiResponse.success("Reminder updated", convertToDto(reminderRepository.save(reminder)));
    }

    @Override
    public ApiResponse<String> markDone(Long id) {
        CustomerReminder reminder = reminderRepository.findById(id).orElse(null);
        if (reminder == null) {
            return ApiResponse.error("Reminder not found");
        }
        reminder.setStatus(DONE);
        reminderRepository.save(reminder);
        return ApiResponse.success("Reminder marked as done");
    }

    @Override
    public ApiResponse<String> deleteReminder(Long id) {
        if (!reminderRepository.existsById(id)) {
            return ApiResponse.error("Reminder not found");
        }
        reminderRepository.deleteById(id);
        return ApiResponse.success("Reminder deleted");
    }

    @Override
    public ApiResponse<List<CustomerReminderDto>> getRemindersForCustomer(Long customerId) {
        return ApiResponse.success(reminderRepository.findByCustomerIdOrderByRemindAtDesc(customerId)
                .stream().map(this::convertToDto).toList());
    }

    @Override
    public ApiResponse<List<CustomerReminderDto>> getOpenReminders() {
        return ApiResponse.success(reminderRepository.findByStatusInOrderByRemindAtAsc(OPEN_STATUSES)
                .stream().map(this::convertToDto).toList());
    }

    /**
     * Bell feed: today's reminders plus anything still open from earlier days. Derived from the
     * dates themselves rather than from the stored status, so it stays correct even if the
     * scheduled sweep has not run since midnight.
     */
    @Override
    public ApiResponse<Map<String, Object>> getNotifications() {
        List<CustomerReminderDto> due = reminderRepository
                .findByStatusNotAndRemindAtLessThanOrderByRemindAtAsc(DONE, startOfTomorrow())
                .stream().map(this::convertToDto).toList();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("count", due.size());
        payload.put("reminders", due);
        return ApiResponse.success(payload);
    }

    @Override
    public ApiResponse<Page<CustomerReminderDto>> getReminders(String bucket, String search, int page, int size) {
        LocalDateTime todayStart = today().atStartOfDay();
        LocalDateTime tomorrowStart = startOfTomorrow();

        List<CustomerReminder.ReminderStatus> statuses = OPEN_STATUSES;
        LocalDateTime from = MIN_BOUND;
        LocalDateTime to = MAX_BOUND;
        Sort sort = Sort.by("remindAt").ascending();

        String key = bucket == null ? "" : bucket.trim().toUpperCase();
        switch (key) {
            case "TODAY" -> {
                from = todayStart;
                to = tomorrowStart;
            }
            case "OVERDUE" -> to = todayStart;
            case "UPCOMING" -> from = tomorrowStart;
            case "DONE" -> {
                statuses = List.of(DONE);
                sort = Sort.by("remindAt").descending();
            }
            // "ALL" or unrecognised: every open reminder, soonest first
            default -> { }
        }

        String q = (search == null || search.isBlank()) ? "%" : "%" + search.trim().toLowerCase() + "%";
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : size, sort);
        Page<CustomerReminderDto> result = reminderRepository
                .search(statuses, from, to, q, pageable)
                .map(this::convertToDto);
        return ApiResponse.success(result);
    }

    @Override
    public ApiResponse<Map<String, Long>> getReminderStats() {
        LocalDateTime todayStart = today().atStartOfDay();
        LocalDateTime tomorrowStart = startOfTomorrow();

        long todayCount = reminderRepository
                .countByStatusNotAndRemindAtGreaterThanEqualAndRemindAtLessThan(DONE, todayStart, tomorrowStart);
        long overdue = reminderRepository.countByStatusNotAndRemindAtLessThan(DONE, todayStart);
        long upcoming = reminderRepository.countByStatusNotAndRemindAtGreaterThanEqual(DONE, tomorrowStart);
        Long done = reminderRepository.countByStatus(DONE);

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("all", todayCount + overdue + upcoming);
        stats.put("today", todayCount);
        stats.put("overdue", overdue);
        stats.put("upcoming", upcoming);
        stats.put("done", done == null ? 0L : done);
        return ApiResponse.success(stats);
    }

    /**
     * Keeps the stored status honest for the per-customer tab. Read paths derive due-ness from the
     * date, so this sweep is not load-bearing — an hourly tick is enough, and it self-heals if the
     * container happens to be restarting at midnight.
     */
    @Scheduled(cron = "0 5 * * * *", zone = "${app.business-timezone:Asia/Kolkata}")
    public void markDueReminders() {
        List<CustomerReminder> dueNow = reminderRepository.findByStatusAndRemindAtBefore(
                CustomerReminder.ReminderStatus.PENDING, startOfTomorrow());
        if (dueNow.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now();
        for (CustomerReminder r : dueNow) {
            r.setStatus(CustomerReminder.ReminderStatus.DUE);
            r.setNotifiedAt(now);
        }
        reminderRepository.saveAll(dueNow);
    }

    private CustomerReminderDto convertToDto(CustomerReminder r) {
        CustomerReminderDto dto = new CustomerReminderDto();
        dto.setId(r.getId());
        dto.setCustomerId(r.getCustomer().getId());
        dto.setCustomerName(r.getCustomer().getName());
        dto.setTitle(r.getTitle());
        dto.setNotes(r.getNotes());
        dto.setRemindAt(r.getRemindAt());
        dto.setStatus(r.getStatus());
        dto.setNotifiedAt(r.getNotifiedAt());
        dto.setCreatedBy(r.getCreatedBy());
        dto.setCreatedAt(r.getCreatedAt());

        LocalDate date = r.getRemindAt().toLocalDate();
        LocalDate today = today();
        dto.setRemindDate(date);
        dto.setBucket(r.getStatus() == DONE ? "DONE"
                : date.isBefore(today) ? "OVERDUE"
                : date.isEqual(today) ? "TODAY"
                : "UPCOMING");
        return dto;
    }
}
