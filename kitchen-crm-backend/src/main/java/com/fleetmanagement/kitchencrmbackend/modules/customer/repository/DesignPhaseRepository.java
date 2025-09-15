package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DesignPhaseRepository extends JpaRepository<DesignPhase, Long> {
    Optional<DesignPhase> findByCustomerId(Long customerId);
    void deleteByCustomerId(Long customerId);
}