package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerFollowUpRepository extends JpaRepository<CustomerFollowUp, Long> {
    List<CustomerFollowUp> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
