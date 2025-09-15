package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductionInstallationRepository extends JpaRepository<ProductionInstallation, Long> {
    Optional<ProductionInstallation> findByCustomerId(Long customerId);
    void deleteByCustomerId(Long customerId);
}