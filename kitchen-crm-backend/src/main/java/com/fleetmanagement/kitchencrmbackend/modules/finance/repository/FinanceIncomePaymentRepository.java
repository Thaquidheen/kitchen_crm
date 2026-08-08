package com.fleetmanagement.kitchencrmbackend.modules.finance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceIncomePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface FinanceIncomePaymentRepository extends JpaRepository<FinanceIncomePayment, Long> {

    List<FinanceIncomePayment> findByFinanceIdOrderByPaymentDateAscIdAsc(Long financeId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM FinanceIncomePayment p WHERE p.finance.id = :financeId")
    BigDecimal sumByFinanceId(@Param("financeId") Long financeId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM FinanceIncomePayment p " +
            "WHERE p.finance.id = :financeId AND p.mode = :mode")
    BigDecimal sumByFinanceIdAndMode(@Param("financeId") Long financeId,
                                     @Param("mode") FinanceIncomePayment.PaymentMode mode);

    @Query("SELECT p.finance.id, COALESCE(SUM(p.amount), 0) FROM FinanceIncomePayment p " +
            "WHERE p.finance.id IN :financeIds GROUP BY p.finance.id")
    List<Object[]> sumByFinanceIds(@Param("financeIds") Collection<Long> financeIds);

    @Query("SELECT p.finance.id, COUNT(p) FROM FinanceIncomePayment p " +
            "WHERE p.finance.id IN :financeIds GROUP BY p.finance.id")
    List<Object[]> countByFinanceIds(@Param("financeIds") Collection<Long> financeIds);

    // Dashboard: dated collections
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM FinanceIncomePayment p " +
            "WHERE p.paymentDate BETWEEN :fromDate AND :toDate")
    BigDecimal sumBetween(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT p.mode, COALESCE(SUM(p.amount), 0) FROM FinanceIncomePayment p GROUP BY p.mode")
    List<Object[]> sumGroupedByMode();

    @Query("SELECT YEAR(p.paymentDate), MONTH(p.paymentDate), COALESCE(SUM(p.amount), 0) " +
            "FROM FinanceIncomePayment p WHERE p.paymentDate BETWEEN :fromDate AND :toDate " +
            "GROUP BY YEAR(p.paymentDate), MONTH(p.paymentDate)")
    List<Object[]> sumGroupedByMonth(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
