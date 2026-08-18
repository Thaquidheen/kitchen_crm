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

    // Expensed-per-vendor used to live here as a GROUP BY. It is now accumulated in
    // FinanceServiceImpl.buildSummary from the expense list that method already loads, so the
    // per-vendor cash/bank split is summed from the very same rounded per-line amounts the UI
    // renders. A SQL aggregate would round independently and drift from the visible column.
}
