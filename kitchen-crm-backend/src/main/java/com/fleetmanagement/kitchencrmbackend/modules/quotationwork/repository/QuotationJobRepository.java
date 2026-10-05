package com.fleetmanagement.kitchencrmbackend.modules.quotationwork.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.quotationwork.entity.QuotationJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface QuotationJobRepository extends JpaRepository<QuotationJob, Long> {

    @Query("SELECT j FROM QuotationJob j JOIN FETCH j.customer WHERE j.status IN :statuses")
    List<QuotationJob> findByStatuses(@Param("statuses") Collection<String> statuses);

    @Query("SELECT j FROM QuotationJob j JOIN FETCH j.customer WHERE j.assigneeUserId = :userId AND j.status IN :statuses")
    List<QuotationJob> findByAssigneeAndStatuses(@Param("userId") Long userId,
                                                 @Param("statuses") Collection<String> statuses);

    /** Completed work that is recent, or that the admin side has not looked at yet. */
    @Query("SELECT j FROM QuotationJob j JOIN FETCH j.customer WHERE j.status = 'COMPLETED' "
            + "AND (j.completedAt >= :since OR j.adminSeenAt IS NULL OR j.coordinatorSeenAt IS NULL)")
    List<QuotationJob> findCompletedSince(@Param("since") LocalDateTime since);

    @Query("SELECT j FROM QuotationJob j JOIN FETCH j.customer WHERE j.customer.id = :customerId AND j.status IN :statuses")
    List<QuotationJob> findByCustomerAndStatuses(@Param("customerId") Long customerId,
                                                 @Param("statuses") Collection<String> statuses);

    /**
     * Customers at the given stage that nobody is preparing a quotation for and that have no
     * quotation at all yet. A customer whose quotation the admin starts directly drops out by itself.
     */
    @Query("SELECT c FROM Customer c WHERE c.status = :stage "
            + "AND NOT EXISTS (SELECT j.id FROM QuotationJob j WHERE j.customer = c AND j.status IN ('WAITING', 'IN_PROGRESS')) "
            + "AND NOT EXISTS (SELECT q.id FROM Quotation q WHERE q.customer = c) "
            + "ORDER BY c.id DESC")
    List<Customer> findCustomersWithoutQuotationWork(@Param("stage") Customer.CustomerStatus stage);

    /**
     * The quotations of these customers, newest first — what a job can open or hand in. Rows are
     * {customerId, id, quotationNumber, projectName, versionNumber, status, createdAt}; no prices.
     */
    @Query("SELECT q.customer.id, q.id, q.quotationNumber, q.projectName, q.versionNumber, q.status, q.createdAt "
            + "FROM Quotation q WHERE q.customer.id IN :customerIds ORDER BY q.id DESC")
    List<Object[]> findQuotationsOfCustomers(@Param("customerIds") Collection<Long> customerIds);
}
