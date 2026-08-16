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

    // Was: customers with an ACTIVE project. Projects are gone; a CONFIRMED customer is the
    // surviving signal that work is actually under way.
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.status = com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer.CustomerStatus.CONFIRMED")
    Long countActiveCustomers();

    // Value bands now come from quotation totals — the surviving record of what a customer is worth.
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT q.customer.id FROM Quotation q GROUP BY q.customer.id HAVING SUM(q.totalAmount) > 500000)")
    Long countPremiumCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT q.customer.id FROM Quotation q GROUP BY q.customer.id HAVING SUM(q.totalAmount) BETWEEN 100000 AND 500000)")
    Long countStandardCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT q.customer.id FROM Quotation q GROUP BY q.customer.id HAVING SUM(q.totalAmount) < 100000)")
    Long countBudgetCustomers();

    // A prospect is now simply a customer nobody has quoted yet. NOT EXISTS rather than NOT IN:
    // NOT IN against an empty or null-bearing subquery does not behave the way you would expect.
    @Query("SELECT COUNT(c) FROM Customer c WHERE NOT EXISTS (SELECT 1 FROM Quotation q WHERE q.customer.id = c.id)")
    Long countProspects();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.id IN (SELECT DISTINCT q.customer.id FROM Quotation q)")
    Long countLeads();

    // Was: customers with a COMPLETED project. A warranty card is issued at handover, so it is
    // the surviving marker that a customer's job finished.
    @Query("SELECT COUNT(c) FROM Customer c WHERE EXISTS (SELECT 1 FROM WarrantyCard w WHERE w.customer.id = c.id)")
    Long countCompletedCustomers();

    // Revenue per customer now sums their quotations. NOTE: the `limit` parameter was already
    // unused before this change — the query has never applied it.
    @Query("SELECT c.id, c.name, SUM(q.totalAmount), COUNT(q) FROM Customer c JOIN Quotation q ON c.id = q.customer.id GROUP BY c.id, c.name ORDER BY SUM(q.totalAmount) DESC")
    List<Object[]> getTopCustomersByRevenue(@Param("limit") int limit);
}