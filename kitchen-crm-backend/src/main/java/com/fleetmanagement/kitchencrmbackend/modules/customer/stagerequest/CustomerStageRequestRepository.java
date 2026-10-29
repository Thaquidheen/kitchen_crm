package com.fleetmanagement.kitchencrmbackend.modules.customer.stagerequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CustomerStageRequestRepository extends JpaRepository<CustomerStageRequest, Long> {

    List<CustomerStageRequest> findByStatusOrderByIdDesc(String status);

    List<CustomerStageRequest> findByCustomerIdAndStatus(Long customerId, String status);

    /** What the admin's list shows under the open ones: answers given lately. */
    List<CustomerStageRequest> findByStatusNotAndDecidedAtAfterOrderByDecidedAtDesc(String status, LocalDateTime since);

    /** Someone's own requests, lately. */
    List<CustomerStageRequest> findByRequestedByUserIdAndCreatedAtAfterOrderByIdDesc(Long userId, LocalDateTime since);
}
