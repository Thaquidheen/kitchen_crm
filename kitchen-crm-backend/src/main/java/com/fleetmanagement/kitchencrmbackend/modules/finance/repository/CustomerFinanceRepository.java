package com.fleetmanagement.kitchencrmbackend.modules.finance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.CustomerFinance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerFinanceRepository extends JpaRepository<CustomerFinance, Long> {

    Optional<CustomerFinance> findByCustomerId(Long customerId);

    /** Total value invoiced across every customer, for the dashboard's outstanding figure. */
    @Query("SELECT COALESCE(SUM(f.totalAmount), 0) FROM CustomerFinance f")
    BigDecimal sumTotalAmount();

    boolean existsByCustomerId(Long customerId);

    @Query(value = "SELECT f FROM CustomerFinance f JOIN FETCH f.customer c WHERE " +
            "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(c.contact, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(c.place, '')) LIKE LOWER(CONCAT('%', :search, '%')))",
            countQuery = "SELECT COUNT(f) FROM CustomerFinance f JOIN f.customer c WHERE " +
            "(:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(c.contact, '')) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(COALESCE(c.place, '')) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<CustomerFinance> search(@Param("search") String search, Pageable pageable);

    /** Customers who do not have a finance header yet — for the "Start finance" picker. */
    @Query("SELECT c FROM Customer c WHERE c.id NOT IN (SELECT f.customer.id FROM CustomerFinance f) " +
            "AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY c.name ASC")
    List<Customer> findEligibleCustomers(@Param("search") String search, Pageable pageable);
}
