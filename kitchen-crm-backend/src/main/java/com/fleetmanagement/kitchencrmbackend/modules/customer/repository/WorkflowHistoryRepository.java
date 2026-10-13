package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkflowHistoryRepository extends JpaRepository<WorkflowHistory, Long> {
    List<WorkflowHistory> findByCustomerIdOrderByTimestampDesc(Long customerId);
    Page<WorkflowHistory> findAllByOrderByTimestampDesc(Pageable pageable);

    /** When each of these customers last moved INTO a stage from another one: rows {customerId, timestamp}. */
    @Query("SELECT w.customer.id, MAX(w.timestamp) FROM WorkflowHistory w WHERE w.customer.id IN :customerIds "
            + "AND w.newState = :state AND (w.previousState IS NULL OR w.previousState <> :state) GROUP BY w.customer.id")
    List<Object[]> findLastEntered(@Param("customerIds") java.util.Collection<Long> customerIds, @Param("state") String state);

    @Query("SELECT w FROM WorkflowHistory w WHERE " +
            "(:customerId IS NULL OR w.customer.id = :customerId) AND " +
            "(:changedBy IS NULL OR LOWER(w.changedBy) LIKE LOWER(CONCAT('%', :changedBy, '%'))) AND " +
            "(:fromDate IS NULL OR w.timestamp >= :fromDate) AND " +
            "(:toDate IS NULL OR w.timestamp <= :toDate) " +
            "ORDER BY w.timestamp DESC")
    Page<WorkflowHistory> findByFilters(@Param("customerId") Long customerId,
                                        @Param("changedBy") String changedBy,
                                        @Param("fromDate") LocalDateTime fromDate,
                                        @Param("toDate") LocalDateTime toDate,
                                        Pageable pageable);
}