package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerRequirements;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRequirementsRepository extends JpaRepository<CustomerRequirements, Long> {
    Optional<CustomerRequirements> findByCustomerId(Long customerId);
    boolean existsByCustomerId(Long customerId);
}


