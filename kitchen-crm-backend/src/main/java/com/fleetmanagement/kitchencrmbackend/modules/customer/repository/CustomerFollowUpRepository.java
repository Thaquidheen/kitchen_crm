package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerFollowUpRepository extends JpaRepository<CustomerFollowUp, Long> {
    List<CustomerFollowUp> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    /** Creator-scoped: ViewerScope.ALL (-1) sees every row, any other value only that user's. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM CustomerFollowUp f WHERE f.customer.id = :customerId "
            + "AND (:viewerId = -1 OR f.createdByUserId = :viewerId) ORDER BY f.createdAt DESC")
    List<CustomerFollowUp> findForCustomer(
            @org.springframework.data.repository.query.Param("customerId") Long customerId,
            @org.springframework.data.repository.query.Param("viewerId") long viewerId);
}
