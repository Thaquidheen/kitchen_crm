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

    /** The most recent call — backs the denormalised {@code last_called_at} column. */
    Optional<ApplianceCustomerFollowUp> findFirstByApplianceCustomerIdOrderByCalledAtDescIdDesc(Long applianceCustomerId);
}
