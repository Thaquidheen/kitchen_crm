package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);
    List<Customer> findByStatus(Customer.CustomerStatus status);
    Boolean existsByEmail(String email);

    @Query("SELECT c FROM Customer c WHERE " +
            "(:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:email IS NULL OR LOWER(c.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
            "(:status IS NULL OR c.status = :status)")
    Page<Customer> findByFilters(@Param("name") String name,
                                 @Param("email") String email,
                                 @Param("status") Customer.CustomerStatus status,
                                 Pageable pageable);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.status = :status")
    Long countByStatus(@Param("status") Customer.CustomerStatus status);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt BETWEEN :fromDate AND :toDate")
    Long countByCreatedAtBetween(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt < :beforeDate")
    Long countByCreatedAtBefore(@Param("beforeDate") LocalDateTime beforeDate);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT p.customer.id FROM CustomerProject p WHERE p.status = 'ACTIVE')")
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

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT p.customer.id FROM CustomerProject p WHERE p.status = 'COMPLETED')")
    Long countCompletedCustomers();

    @Query("SELECT c.id, c.name, SUM(p.receivedAmountTotal), COUNT(p) FROM Customer c JOIN CustomerProject p ON c.id = p.customer.id GROUP BY c.id, c.name ORDER BY SUM(p.receivedAmountTotal) DESC")
    List<Object[]> getTopCustomersByRevenue(@Param("limit") int limit);
}