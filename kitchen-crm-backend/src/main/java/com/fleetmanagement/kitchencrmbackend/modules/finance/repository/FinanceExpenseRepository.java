package com.fleetmanagement.kitchencrmbackend.modules.finance.repository;

import com.fleetmanagement.kitchencrmbackend.modules.finance.entity.FinanceExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
public interface FinanceExpenseRepository extends JpaRepository<FinanceExpense, Long> {

    List<FinanceExpense> findByFinanceIdOrderByIdAsc(Long financeId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM FinanceExpense e WHERE e.finance.id = :financeId")
    BigDecimal sumByFinanceId(@Param("financeId") Long financeId);

    @Query("SELECT e.finance.id, COALESCE(SUM(e.amount), 0) FROM FinanceExpense e " +
            "WHERE e.finance.id IN :financeIds GROUP BY e.finance.id")
    List<Object[]> sumByFinanceIds(@Param("financeIds") Collection<Long> financeIds);

    /** Expensed per vendor (vendor-less lines excluded) — the other half of the vendor balance. */
    @Query("SELECT e.vendor.id, e.vendor.vendorName, COALESCE(SUM(e.amount), 0), COUNT(e) " +
            "FROM FinanceExpense e WHERE e.finance.id = :financeId AND e.vendor IS NOT NULL " +
            "GROUP BY e.vendor.id, e.vendor.vendorName")
    List<Object[]> vendorTotals(@Param("financeId") Long financeId);
}
