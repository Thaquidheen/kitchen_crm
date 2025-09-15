package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerPipelineRepository extends JpaRepository<CustomerPipeline, Long> {
    Optional<CustomerPipeline> findByCustomerId(Long customerId);
    void deleteByCustomerId(Long customerId);
}