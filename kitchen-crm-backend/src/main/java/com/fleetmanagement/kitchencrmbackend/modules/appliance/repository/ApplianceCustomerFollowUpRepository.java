package com.fleetmanagement.kitchencrmbackend.modules.appliance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomerFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplianceCustomerFollowUpRepository extends JpaRepository<ApplianceCustomerFollowUp, Long> {
    /** Newest call first, matching the architect notes feed. */
    List<ApplianceCustomerFollowUp> findByApplianceCustomerIdOrderByCalledAtDescIdDesc(Long applianceCustomerId);

    /**
     * Creator-scoped list of call notes. The separate "most recent call" finder above is left
     * unscoped on purpose: last_called_at is an operational fact everyone needs, or two people
     * ring the same customer. Only the note text is private.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM ApplianceCustomerFollowUp f WHERE f.applianceCustomer.id = :applianceCustomerId "
            + "AND (:viewerId = -1 OR f.createdByUserId = :viewerId) ORDER BY f.calledAt DESC, f.id DESC")
    List<ApplianceCustomerFollowUp> findForApplianceCustomer(
            @org.springframework.data.repository.query.Param("applianceCustomerId") Long applianceCustomerId,
            @org.springframework.data.repository.query.Param("viewerId") long viewerId);

    /** The most recent call — backs the denormalised {@code last_called_at} column. */
    Optional<ApplianceCustomerFollowUp> findFirstByApplianceCustomerIdOrderByCalledAtDescIdDesc(Long applianceCustomerId);
}
