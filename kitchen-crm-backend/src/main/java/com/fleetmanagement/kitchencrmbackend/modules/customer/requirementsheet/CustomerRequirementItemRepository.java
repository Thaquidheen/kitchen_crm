package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRequirementItemRepository extends JpaRepository<CustomerRequirementItem, Long> {

    List<CustomerRequirementItem> findByCustomerIdOrderByIdAsc(Long customerId);
}
