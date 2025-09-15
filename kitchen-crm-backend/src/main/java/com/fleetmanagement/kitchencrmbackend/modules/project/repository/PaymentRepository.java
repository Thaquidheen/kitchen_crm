package com.fleetmanagement.kitchencrmbackend.modules.project.repository;

import com.fleetmanagement.kitchencrmbackend.modules.project.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByProjectId(Long projectId);

    List<Payment> findByProjectIdOrderByPaymentDateDesc(Long projectId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.project.id = :projectId AND p.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalPaidAmountByProject(@Param("projectId") Long projectId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentMethod = :paymentMethod AND p.project.id = :projectId AND p.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalPaidByMethodAndProject(@Param("paymentMethod") Payment.PaymentMethod paymentMethod,
                                              @Param("projectId") Long projectId);

    long countByPaymentStatus(Payment.PaymentStatus status);

    @Query("SELECT p FROM Payment p WHERE " +
            "(:projectId IS NULL OR p.project.id = :projectId) AND " +
            "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
            "(:paymentStatus IS NULL OR p.paymentStatus = :paymentStatus) AND " +
            "(:fromDate IS NULL OR p.paymentDate >= :fromDate) AND " +
            "(:toDate IS NULL OR p.paymentDate <= :toDate) AND " +
            "(:customerName IS NULL OR LOWER(p.project.customer.name) LIKE LOWER(CONCAT('%', :customerName, '%')))")
    Page<Payment> findByFilters(@Param("projectId") Long projectId,
                                @Param("paymentMethod") Payment.PaymentMethod paymentMethod,
                                @Param("paymentStatus") Payment.PaymentStatus paymentStatus,
                                @Param("fromDate") LocalDate fromDate,
                                @Param("toDate") LocalDate toDate,
                                @Param("customerName") String customerName,
                                Pageable pageable);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentDate BETWEEN :fromDate AND :toDate AND p.paymentStatus = 'COMPLETED'")
    BigDecimal getTotalPaymentsBetweenDates(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT p.paymentMethod, SUM(p.amount) FROM Payment p WHERE p.paymentStatus = 'COMPLETED' GROUP BY p.paymentMethod")
    List<Object[]> getPaymentMethodSummary();
}