package com.fleetmanagement.kitchencrmbackend.modules.task.repository;

import org.springframework.data.jpa.repository.Modifying;
import java.time.LocalDateTime;

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

    /** Assignee's list, oldest due first. */
    List<EmployeeTask> findByAssignedToIdOrderByTaskDateAscIdAsc(Long employeeId);

    /** Assigner's list, newest due first (Team Tasks tab). */
    List<EmployeeTask> findByAssignedByIdOrderByTaskDateDescIdDesc(Long adminId);

    /**
     * Staff bell feed: my open tasks due today or earlier, PLUS any not yet acknowledged regardless
     * of date - a task assigned for next week must still be announced now, not on its day.
     */
    @Query("SELECT t FROM EmployeeTask t WHERE t.assignedTo.id = :userId AND (" +
           "(t.completed = false AND (t.taskDate <= :today OR t.acknowledgedAt IS NULL)) " +
           // ...plus any task (open or done) with an assigner reply the assignee has not read.
           "OR EXISTS (SELECT r.id FROM EmployeeTaskReply r WHERE r.task = t AND r.fromAssignee = false " +
           "AND (t.assigneeRepliesSeenAt IS NULL OR r.createdAt > t.assigneeRepliesSeenAt))" +
           ") ORDER BY t.taskDate ASC, t.id ASC")
    List<EmployeeTask> findDueForAssignee(@Param("userId") Long userId, @Param("today") LocalDate today);

    /**
     * Assigner bell feed: tasks I assigned that were completed and I have not yet seen, plus open
     * ones past their date. Completed-unseen leads, newest completion first.
     */
    @Query("SELECT t FROM EmployeeTask t WHERE t.assignedBy.id = :adminId AND (" +
           "(t.completed = true AND t.completionSeenAt IS NULL) OR (t.completed = false AND t.taskDate < :today) " +
           // ...plus any task with an assignee reply the assigner has not read.
           "OR EXISTS (SELECT r.id FROM EmployeeTaskReply r WHERE r.task = t AND r.fromAssignee = true " +
           "AND (t.assignerRepliesSeenAt IS NULL OR r.createdAt > t.assignerRepliesSeenAt))) " +
           "ORDER BY t.completed DESC, t.completedAt DESC, t.taskDate ASC")
    List<EmployeeTask> findAttentionForAssigner(@Param("adminId") Long adminId, @Param("today") LocalDate today);

    /** The assignee opened their list: every open, unseen assignment stops being "new". */
    @Modifying
    @Query("UPDATE EmployeeTask t SET t.acknowledgedAt = :now WHERE t.assignedTo.id = :userId " +
           "AND t.acknowledgedAt IS NULL AND t.completed = false")
    int acknowledgeAllForAssignee(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /** The assigner has seen every completion. */
    @Modifying
    @Query("UPDATE EmployeeTask t SET t.completionSeenAt = :now WHERE t.assignedBy.id = :adminId " +
           "AND t.completed = true AND t.completionSeenAt IS NULL")
    int markAllCompletionsSeen(@Param("adminId") Long adminId, @Param("now") LocalDateTime now);
}
