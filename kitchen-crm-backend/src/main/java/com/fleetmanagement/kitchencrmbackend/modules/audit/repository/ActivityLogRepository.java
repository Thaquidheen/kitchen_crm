package com.fleetmanagement.kitchencrmbackend.modules.audit.repository;

import com.fleetmanagement.kitchencrmbackend.modules.audit.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enum filters follow the reminders no-nulls convention: the caller always passes a list of
 * event types (all values when unfiltered) rather than a nullable enum param — ":x IS NULL"
 * against typed params and inner-enum JPQL literals are both fragile across Hibernate versions.
 *
 * The chip-count queries take the SAME module/actor/date bounds as the page query. Counting
 * without them produced chips that contradicted the table: an admin narrowing to one day still
 * saw all-time totals next to a filtered result set.
 */
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /** Filtered page for the Settings viewer. Sentinels: types always supplied, '%%' matches all. */
    @Query("SELECT a FROM ActivityLog a WHERE " +
            "a.eventType IN :types AND " +
            "(:module IS NULL OR a.module = :module) AND " +
            "(LOWER(COALESCE(a.actorEmail, '')) LIKE :actor OR LOWER(COALESCE(a.actorName, '')) LIKE :actor) AND " +
            "a.createdAt >= :fromDate AND a.createdAt < :toDate")
    Page<ActivityLog> findByFilters(@Param("types") List<ActivityLog.EventType> types,
                                    @Param("module") String module,
                                    @Param("actor") String actor,
                                    @Param("fromDate") LocalDateTime fromDate,
                                    @Param("toDate") LocalDateTime toDate,
                                    Pageable pageable);

    /** Chip counts per event type, within the same non-event filters the table is showing. */
    @Query("SELECT a.eventType, COUNT(a) FROM ActivityLog a WHERE " +
            "(:module IS NULL OR a.module = :module) AND " +
            "(LOWER(COALESCE(a.actorEmail, '')) LIKE :actor OR LOWER(COALESCE(a.actorName, '')) LIKE :actor) AND " +
            "a.createdAt >= :fromDate AND a.createdAt < :toDate " +
            "GROUP BY a.eventType")
    List<Object[]> countByEventType(@Param("module") String module,
                                    @Param("actor") String actor,
                                    @Param("fromDate") LocalDateTime fromDate,
                                    @Param("toDate") LocalDateTime toDate);

    /** Rows per module, busiest first, for the module picker. Only ACTION rows carry a module. */
    @Query("SELECT a.module, COUNT(a) FROM ActivityLog a WHERE " +
            "a.module IS NOT NULL AND " +
            "(LOWER(COALESCE(a.actorEmail, '')) LIKE :actor OR LOWER(COALESCE(a.actorName, '')) LIKE :actor) AND " +
            "a.createdAt >= :fromDate AND a.createdAt < :toDate " +
            "GROUP BY a.module ORDER BY COUNT(a) DESC")
    List<Object[]> countByModule(@Param("actor") String actor,
                                 @Param("fromDate") LocalDateTime fromDate,
                                 @Param("toDate") LocalDateTime toDate);

    /**
     * Sign-in summary per user: last login, login count, distinct source IPs. Pageable-bounded —
     * this groups by actor_email over an append-only table that keeps rows for departed staff
     * (it is FK-free by design), so the unbounded list only ever grows.
     */
    @Query("SELECT a.actorEmail, MAX(a.createdAt), COUNT(a), COUNT(DISTINCT a.ipAddress) " +
            "FROM ActivityLog a WHERE a.eventType = :type AND a.actorEmail IS NOT NULL " +
            "GROUP BY a.actorEmail ORDER BY MAX(a.createdAt) DESC")
    List<Object[]> loginSummaryByUser(@Param("type") ActivityLog.EventType type, Pageable pageable);

    /**
     * Distinct IPs a user has signed in from, most recent first. The LIMIT is applied by the
     * database via Pageable, not by breaking out of a loop over every IP ever recorded.
     */
    @Query("SELECT a.ipAddress, MAX(a.createdAt) FROM ActivityLog a " +
            "WHERE a.eventType = :type AND a.actorEmail = :email AND a.ipAddress IS NOT NULL " +
            "GROUP BY a.ipAddress ORDER BY MAX(a.createdAt) DESC")
    List<Object[]> recentLoginIps(@Param("type") ActivityLog.EventType type,
                                  @Param("email") String email,
                                  Pageable pageable);

    /** Retention: failed sign-ins are the highest-volume, shortest-value rows. */
    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.eventType = :type AND a.createdAt < :before")
    int deleteByEventTypeOlderThan(@Param("type") ActivityLog.EventType type,
                                   @Param("before") LocalDateTime before);

    @Modifying
    @Query("DELETE FROM ActivityLog a WHERE a.createdAt < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);
}
