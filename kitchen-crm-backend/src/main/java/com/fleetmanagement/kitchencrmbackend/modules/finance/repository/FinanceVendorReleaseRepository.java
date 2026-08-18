package com.fleetmanagement.kitchencrmbackend.modules.finance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceIncomePayment;
import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceVendorRelease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FinanceVendorReleaseRepository extends JpaRepository<FinanceVendorRelease, Long> {

    List<FinanceVendorRelease> findByFinanceIdOrderByReleaseDateAscIdAsc(Long financeId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM FinanceVendorRelease r WHERE r.finance.id = :financeId")
    BigDecimal sumByFinanceId(@Param("financeId") Long financeId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM FinanceVendorRelease r " +
            "WHERE r.finance.id = :financeId AND r.mode = :mode")
    BigDecimal sumByFinanceIdAndMode(@Param("financeId") Long financeId,
                                     @Param("mode") FinanceIncomePayment.PaymentMode mode);

    @Query("SELECT r.expense.id, COALESCE(SUM(r.amount), 0) FROM FinanceVendorRelease r " +
            "WHERE r.finance.id = :financeId AND r.expense IS NOT NULL GROUP BY r.expense.id")
    List<Object[]> sumGroupedByExpense(@Param("financeId") Long financeId);

    // Released-per-vendor is now accumulated in FinanceServiceImpl.buildSummary from the release
    // list that method already loads, which is also where each release's mode is split into the
    // cash/bank buckets. See the matching note in FinanceExpenseRepository.
}
