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

    /*
     * Every read below is scoped to the creator: pass ViewerScope.ALL (-1) for a super admin,
     * or a user id to see only that person's rows. The scope is a required parameter rather
     * than an optional filter so a new read path cannot silently be left unscoped.
     * Rows with a NULL created_by_user_id (legacy) never equal a real id, so they are visible
     * only under ALL - i.e. to a super admin.
     */
    String SCOPE = "(:viewerId = -1 OR r.createdByUserId = :viewerId)";

    @Query("SELECT r FROM CustomerReminder r WHERE r.customer.id = :customerId AND " + SCOPE
            + " ORDER BY r.remindAt DESC")
    List<CustomerReminder> findForCustomer(@Param("customerId") Long customerId,
                                           @Param("viewerId") long viewerId);

    @Query("SELECT r FROM CustomerReminder r WHERE r.applianceCustomer.id = :applianceCustomerId AND " + SCOPE
            + " ORDER BY r.remindAt DESC")
    List<CustomerReminder> findForApplianceCustomer(@Param("applianceCustomerId") Long applianceCustomerId,
                                                    @Param("viewerId") long viewerId);

    // Scheduler: pending reminders whose day has arrived
    List<CustomerReminder> findByStatusAndRemindAtBefore(CustomerReminder.ReminderStatus status, LocalDateTime time);

    // Bell: everything currently due (until marked done), newest first
    List<CustomerReminder> findByStatusOrderByRemindAtDesc(CustomerReminder.ReminderStatus status);

    // Reminders list: not-done reminders ordered soonest first
    @Query("SELECT r FROM CustomerReminder r WHERE r.status IN :statuses AND " + SCOPE
            + " ORDER BY r.remindAt ASC")
    List<CustomerReminder> findOpen(@Param("statuses") List<CustomerReminder.ReminderStatus> statuses,
                                    @Param("viewerId") long viewerId);

    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status = :status AND " + SCOPE)
    long countWithStatus(@Param("status") CustomerReminder.ReminderStatus status,
                         @Param("viewerId") long viewerId);

    /**
     * Bell feed: every open reminder dated today or earlier. Bounded by the start of tomorrow
     * rather than by "now", so a reminder is visible for the whole of its own day.
     */
    @EntityGraph(attributePaths = {"customer", "applianceCustomer", "architect"})
    @Query("SELECT r FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.remindAt < :endExclusive AND " + SCOPE + " ORDER BY r.remindAt ASC")
    List<CustomerReminder> findDueForBell(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                                          @Param("endExclusive") LocalDateTime endExclusive,
                                          @Param("viewerId") long viewerId);

    /**
     * Purge one module's reminders for a customer — used when a production job is deleted so its
     * SOP and task reminders do not linger in the bell. Derived delete: loads then removes each
     * row, so the task FK (ON DELETE SET NULL) is handled by the database.
     */
    void deleteByCustomer_IdAndSource(Long customerId, CustomerReminder.ReminderSource source);

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
            + "LEFT JOIN FETCH r.customer c LEFT JOIN FETCH r.applianceCustomer a LEFT JOIN FETCH r.architect ar "
            + "WHERE r.status IN :statuses "
            + "AND r.source IN :sources "
            + "AND (:ownerFilter = 'ANY' "
            + "     OR (:ownerFilter = 'CUSTOMER' AND r.customer IS NOT NULL) "
            + "     OR (:ownerFilter = 'APPLIANCE' AND r.applianceCustomer IS NOT NULL) "
            + "     OR (:ownerFilter = 'ARCHITECT' AND r.architect IS NOT NULL)) "
            + "AND (:viewerId = -1 OR r.createdByUserId = :viewerId) "
            + "AND r.remindAt >= :from AND r.remindAt < :to "
            + "AND (LOWER(r.title) LIKE :q OR LOWER(COALESCE(c.name, a.name, ar.architectureName, '')) LIKE :q)",
           countQuery = "SELECT COUNT(r) FROM CustomerReminder r "
            + "LEFT JOIN r.customer c LEFT JOIN r.applianceCustomer a LEFT JOIN r.architect ar "
            + "WHERE r.status IN :statuses "
            + "AND r.source IN :sources "
            + "AND (:ownerFilter = 'ANY' "
            + "     OR (:ownerFilter = 'CUSTOMER' AND r.customer IS NOT NULL) "
            + "     OR (:ownerFilter = 'APPLIANCE' AND r.applianceCustomer IS NOT NULL) "
            + "     OR (:ownerFilter = 'ARCHITECT' AND r.architect IS NOT NULL)) "
            + "AND (:viewerId = -1 OR r.createdByUserId = :viewerId) "
            + "AND r.remindAt >= :from AND r.remindAt < :to "
            + "AND (LOWER(r.title) LIKE :q OR LOWER(COALESCE(c.name, a.name, ar.architectureName, '')) LIKE :q)")
    Page<CustomerReminder> search(@Param("statuses") List<CustomerReminder.ReminderStatus> statuses,
                                  @Param("sources") List<CustomerReminder.ReminderSource> sources,
                                  @Param("ownerFilter") String ownerFilter,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to,
                                  @Param("q") String q,
                                  @Param("viewerId") long viewerId,
                                  Pageable pageable);

    // Per-source chip counts (open = not DONE), matching the bell's partitioning: appliance by
    // owner, production by source, customers = the remaining customer-owned rows.
    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.applianceCustomer IS NOT NULL AND " + SCOPE)
    long countOpenApplianceOwned(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                                 @Param("viewerId") long viewerId);

    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.architect IS NOT NULL AND " + SCOPE)
    long countOpenArchitectOwned(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                                 @Param("viewerId") long viewerId);

    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.source = :source AND " + SCOPE)
    long countOpenBySource(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                           @Param("source") CustomerReminder.ReminderSource source,
                           @Param("viewerId") long viewerId);

    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.source IN :sources AND r.customer IS NOT NULL AND " + SCOPE)
    long countOpenCustomerOwned(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                                @Param("sources") List<CustomerReminder.ReminderSource> sources,
                                @Param("viewerId") long viewerId);

    // Chip counts. "Open" = anything not DONE.
    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.remindAt >= :from AND r.remindAt < :to AND " + SCOPE)
    long countOpenBetween(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                          @Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                          @Param("viewerId") long viewerId);

    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.remindAt < :to AND " + SCOPE)
    long countOpenBefore(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                         @Param("to") LocalDateTime to, @Param("viewerId") long viewerId);

    @Query("SELECT COUNT(r) FROM CustomerReminder r WHERE r.status <> :excludedStatus AND r.remindAt >= :from AND " + SCOPE)
    long countOpenFrom(@Param("excludedStatus") CustomerReminder.ReminderStatus excludedStatus,
                       @Param("from") LocalDateTime from, @Param("viewerId") long viewerId);
}
