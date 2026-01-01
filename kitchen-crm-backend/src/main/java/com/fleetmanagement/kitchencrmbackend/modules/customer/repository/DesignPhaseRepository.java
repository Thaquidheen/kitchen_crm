package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DesignPhaseRepository extends JpaRepository<DesignPhase, Long> {

    Optional<DesignPhase> findByCustomerId(Long customerId);

    List<DesignPhase> findByDesignStatus(DesignPhase.DesignStatus status);

    List<DesignPhase> findByStaffAssignedId(Long staffId);

    long countByDesignStatus(DesignPhase.DesignStatus status);

    @Query("SELECT d FROM DesignPhase d WHERE d.meetingScheduled BETWEEN :fromDate AND :toDate")
    List<DesignPhase> findMeetingsInDateRange(@Param("fromDate") LocalDateTime fromDate,
                                              @Param("toDate") LocalDateTime toDate);

    @EntityGraph(attributePaths = {"customer", "staffAssigned", "quotation"})
    @Query("SELECT d FROM DesignPhase d WHERE " +
            "(:designStatus IS NULL OR d.designStatus = :designStatus) AND " +
            "(:staffAssignedId IS NULL OR (d.staffAssigned IS NOT NULL AND d.staffAssigned.id = :staffAssignedId)) AND " +
            "(:customerName IS NULL OR LOWER(d.customer.name) LIKE LOWER(CONCAT('%', :customerName, '%'))) AND " +
            "(:submittedToClient IS NULL OR d.submittedToClient = :submittedToClient)")
    Page<DesignPhase> findByFilters(@Param("designStatus") DesignPhase.DesignStatus designStatus,
                                    @Param("staffAssignedId") Long staffAssignedId,
                                    @Param("customerName") String customerName,
                                    @Param("submittedToClient") Boolean submittedToClient,
                                    Pageable pageable);

    @Query("SELECT d FROM DesignPhase d WHERE d.designAmountFrozen = false AND d.designStatus = 'APPROVED'")
    List<DesignPhase> findReadyToFreeze();

    @Query("SELECT d FROM DesignPhase d WHERE d.clientGroupCreated = false AND d.designStatus IN ('APPROVED', 'FROZEN')")
    List<DesignPhase> findReadyForClientGroup();
}