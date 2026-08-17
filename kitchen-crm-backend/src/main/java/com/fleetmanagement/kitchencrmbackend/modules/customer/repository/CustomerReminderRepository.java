package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerReminder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerReminderRepository extends JpaRepository<CustomerReminder, Long> {

    List<CustomerReminder> findByCustomerIdOrderByRemindAtDesc(Long customerId);

    List<CustomerReminder> findByApplianceCustomerIdOrderByRemindAtDesc(Long applianceCustomerId);

    // Scheduler: pending reminders whose day has arrived
    List<CustomerReminder> findByStatusAndRemindAtBefore(CustomerReminder.ReminderStatus status, LocalDateTime time);

    // Bell: everything currently due (until marked done), newest first
    List<CustomerReminder> findByStatusOrderByRemindAtDesc(CustomerReminder.ReminderStatus status);

    // Reminders list: not-done reminders ordered soonest first
    List<CustomerReminder> findByStatusInOrderByRemindAtAsc(List<CustomerReminder.ReminderStatus> statuses);

    Long countByStatus(CustomerReminder.ReminderStatus status);

    /**
     * Bell feed: every open reminder dated today or earlier. Bounded by the start of tomorrow
     * rather than by "now", so a reminder is visible for the whole of its own day.
     */
    @EntityGraph(attributePaths = {"customer", "applianceCustomer"})
    List<CustomerReminder> findByStatusNotAndRemindAtLessThanOrderByRemindAtAsc(
            CustomerReminder.ReminderStatus excludedStatus, LocalDateTime endExclusive);

    /**
     * Cross-owner list for the Reminders page. Bounds are half-open [from, to) and are always
     * supplied — the caller passes wide sentinels for an open end rather than nulls, because
     * ":param IS NULL" in JPQL is fragile across Hibernate versions. {@code q} is lower-cased and
     * %-wrapped by the caller ("%" matches everything).
     *
     * The owner joins MUST be explicit LEFT JOINs: a path expression like {@code r.customer.name}
     * is an implicit INNER join, which would silently drop every appliance-owned reminder (they
     * have a null customer) from both the list and the search.
     */
    // The source/owner filters follow the same no-nulls convention: the caller always passes a
    // sources list (all values when unfiltered) and an ownerFilter of ANY | CUSTOMER | APPLIANCE.
    @Query(value = "SELECT r FROM CustomerReminder r "
            + "LEFT JOIN FETCH r.customer c LEFT JOIN FETCH r.applianceCustomer a "
            + "WHERE r.status IN :statuses "
            + "AND r.source IN :sources "
            + "AND (:ownerFilter = 'ANY' "
            + "     OR (:ownerFilter = 'CUSTOMER' AND r.customer IS NOT NULL) "
            + "     OR (:ownerFilter = 'APPLIANCE' AND r.applianceCustomer IS NOT NULL)) "
            + "AND r.remindAt >= :from AND r.remindAt < :to "
            + "AND (LOWER(r.title) LIKE :q OR LOWER(COALESCE(c.name, a.name, '')) LIKE :q)",
           countQuery = "SELECT COUNT(r) FROM CustomerReminder r "
            + "LEFT JOIN r.customer c LEFT JOIN r.applianceCustomer a "
            + "WHERE r.status IN :statuses "
            + "AND r.source IN :sources "
            + "AND (:ownerFilter = 'ANY' "
            + "     OR (:ownerFilter = 'CUSTOMER' AND r.customer IS NOT NULL) "
            + "     OR (:ownerFilter = 'APPLIANCE' AND r.applianceCustomer IS NOT NULL)) "
            + "AND r.remindAt >= :from AND r.remindAt < :to "
            + "AND (LOWER(r.title) LIKE :q OR LOWER(COALESCE(c.name, a.name, '')) LIKE :q)")
    Page<CustomerReminder> search(@Param("statuses") List<CustomerReminder.ReminderStatus> statuses,
                                  @Param("sources") List<CustomerReminder.ReminderSource> sources,
                                  @Param("ownerFilter") String ownerFilter,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to,
                                  @Param("q") String q,
                                  Pageable pageable);

    // Per-source chip counts (open = not DONE), matching the bell's partitioning: appliance by
    // owner, production by source, customers = the remaining customer-owned rows.
    long countByStatusNotAndApplianceCustomerIsNotNull(CustomerReminder.ReminderStatus excludedStatus);

    long countByStatusNotAndSource(CustomerReminder.ReminderStatus excludedStatus,
                                   CustomerReminder.ReminderSource source);

    long countByStatusNotAndSourceInAndCustomerIsNotNull(CustomerReminder.ReminderStatus excludedStatus,
                                                         List<CustomerReminder.ReminderSource> sources);

    // Chip counts. "Open" = anything not DONE.
    long countByStatusNotAndRemindAtGreaterThanEqualAndRemindAtLessThan(
            CustomerReminder.ReminderStatus excludedStatus, LocalDateTime from, LocalDateTime to);

    long countByStatusNotAndRemindAtLessThan(
            CustomerReminder.ReminderStatus excludedStatus, LocalDateTime to);

    long countByStatusNotAndRemindAtGreaterThanEqual(
            CustomerReminder.ReminderStatus excludedStatus, LocalDateTime from);
}
