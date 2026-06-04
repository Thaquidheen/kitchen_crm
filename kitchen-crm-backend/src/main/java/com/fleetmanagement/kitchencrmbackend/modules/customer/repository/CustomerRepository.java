package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {
    Optional<Customer> findByEmail(String email);
    List<Customer> findByStatus(Customer.CustomerStatus status);
    Boolean existsByEmail(String email);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.status = :status")
    Long countByStatus(@Param("status") Customer.CustomerStatus status);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt BETWEEN :fromDate AND :toDate")
    Long countByCreatedAtBetween(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt < :beforeDate")
    Long countByCreatedAtBefore(@Param("beforeDate") LocalDateTime beforeDate);

    @Query(value = "SELECT COUNT(DISTINCT c.id) FROM customers c INNER JOIN customer_projects p ON c.id = p.customer_id WHERE p.status = 'ACTIVE'", nativeQuery = true)
    Long countActiveCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT p.customer.id FROM CustomerProject p WHERE p.totalAmount > 500000)")
    Long countPremiumCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT p.customer.id FROM CustomerProject p WHERE p.totalAmount BETWEEN 100000 AND 500000)")
    Long countStandardCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT p.customer.id FROM CustomerProject p WHERE p.totalAmount < 100000)")
    Long countBudgetCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id NOT IN (SELECT DISTINCT p.customer.id FROM CustomerProject p)")
    Long countProspects();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT q.customer.id FROM Quotation q)")
    Long countLeads();

    @Query(value = "SELECT COUNT(DISTINCT c.id) FROM customers c INNER JOIN customer_projects p ON c.id = p.customer_id WHERE p.status = 'COMPLETED'", nativeQuery = true)
    Long countCompletedCustomers();

    @Query("SELECT c.id, c.name, SUM(p.receivedAmountTotal), COUNT(p) FROM Customer c JOIN CustomerProject p ON c.id = p.customer.id GROUP BY c.id, c.name ORDER BY SUM(p.receivedAmountTotal) DESC")
    List<Object[]> getTopCustomersByRevenue(@Param("limit") int limit);
}