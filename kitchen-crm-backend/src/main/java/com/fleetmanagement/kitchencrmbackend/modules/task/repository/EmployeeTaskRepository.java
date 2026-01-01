package com.fleetmanagement.kitchencrmbackend.modules.task.repository;

import com.fleetmanagement.kitchencrmbackend.modules.task.entity.EmployeeTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeTaskRepository extends JpaRepository<EmployeeTask, Long> {

    /**
     * Find all tasks assigned to a specific employee
     */
    List<EmployeeTask> findByAssignedToId(Long employeeId);

    /**
     * Find tasks assigned to an employee on a specific date
     */
    List<EmployeeTask> findByAssignedToIdAndTaskDate(Long employeeId, LocalDate taskDate);

    /**
     * Find tasks assigned to an employee within a date range
     */
    List<EmployeeTask> findByAssignedToIdAndTaskDateBetween(Long employeeId, LocalDate fromDate, LocalDate toDate);

    /**
     * Find all tasks for a specific date
     */
    List<EmployeeTask> findByTaskDate(LocalDate taskDate);

    /**
     * Find tasks by date range
     */
    List<EmployeeTask> findByTaskDateBetween(LocalDate fromDate, LocalDate toDate);

    /**
     * Find tasks by status
     */
    List<EmployeeTask> findByStatus(EmployeeTask.TaskStatus status);

    /**
     * Find tasks by completion status
     */
    List<EmployeeTask> findByCompleted(Boolean completed);

    /**
     * Find tasks by employee and completion status
     */
    List<EmployeeTask> findByAssignedToIdAndCompleted(Long employeeId, Boolean completed);

    /**
     * Find tasks by employee, date, and completion status
     */
    List<EmployeeTask> findByAssignedToIdAndTaskDateAndCompleted(Long employeeId, LocalDate taskDate, Boolean completed);

    /**
     * Count tasks by employee and completion status
     */
    long countByAssignedToIdAndCompleted(Long employeeId, Boolean completed);

    /**
     * Count tasks by date and completion status
     */
    long countByTaskDateAndCompleted(LocalDate taskDate, Boolean completed);

    /**
     * Get completion statistics for a date range
     */
    @Query("SELECT COUNT(t) FROM EmployeeTask t WHERE t.taskDate BETWEEN :fromDate AND :toDate AND t.completed = :completed")
    long countByDateRangeAndCompleted(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate, @Param("completed") Boolean completed);

    /**
     * Find all tasks assigned by a specific admin
     */
    List<EmployeeTask> findByAssignedById(Long adminId);
}

