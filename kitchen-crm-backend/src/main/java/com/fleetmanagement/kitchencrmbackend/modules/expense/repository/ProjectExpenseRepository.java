package com.fleetmanagement.kitchencrmbackend.modules.expense.repository;

import com.fleetmanagement.kitchencrmbackend.modules.expense.entity.ProjectExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProjectExpenseRepository extends JpaRepository<ProjectExpense, Long> {

    /**
     * Find all expenses for a project
     */
    List<ProjectExpense> findByProjectIdOrderByPaymentDateDesc(Long projectId);

    /**
     * Find all expenses for a vendor
     */
    List<ProjectExpense> findByVendorIdOrderByPaymentDateDesc(Long vendorId);

    /**
     * Find expenses by project and category
     */
    List<ProjectExpense> findByProjectIdAndExpenseCategory(Long projectId, ProjectExpense.ExpenseCategory category);

    /**
     * Find expenses by project and status
     */
    List<ProjectExpense> findByProjectIdAndStatus(Long projectId, ProjectExpense.ExpenseStatus status);

    /**
     * Calculate total expenses for a project (only PAID status)
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ProjectExpense e " +
           "WHERE e.project.id = :projectId AND e.status = 'PAID'")
    BigDecimal sumAmountByProjectId(@Param("projectId") Long projectId);

    /**
     * Calculate total expenses for a project by category
     */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM ProjectExpense e " +
           "WHERE e.project.id = :projectId AND e.expenseCategory = :category AND e.status = 'PAID'")
    BigDecimal sumAmountByProjectIdAndCategory(
            @Param("projectId") Long projectId,
            @Param("category") ProjectExpense.ExpenseCategory category
    );

    /**
     * Count expenses for a project
     */
    Long countByProjectId(Long projectId);

    /**
     * Find expenses by payment method
     */
    List<ProjectExpense> findByProjectIdAndPaymentMethod(Long projectId, String paymentMethod);
}
