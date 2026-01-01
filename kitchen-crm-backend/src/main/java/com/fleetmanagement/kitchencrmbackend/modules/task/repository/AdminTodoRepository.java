package com.fleetmanagement.kitchencrmbackend.modules.task.repository;

import com.fleetmanagement.kitchencrmbackend.modules.task.entity.AdminTodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AdminTodoRepository extends JpaRepository<AdminTodo, Long> {

    /**
     * Find all todos for a specific user (admin)
     */
    List<AdminTodo> findByUserId(Long userId);

    /**
     * Find todos for a user on a specific date
     */
    List<AdminTodo> findByUserIdAndTodoDate(Long userId, LocalDate todoDate);

    /**
     * Find todos for a user within a date range
     */
    List<AdminTodo> findByUserIdAndTodoDateBetween(Long userId, LocalDate fromDate, LocalDate toDate);

    /**
     * Find todos by completion status for a user
     */
    List<AdminTodo> findByUserIdAndCompleted(Long userId, Boolean completed);

    /**
     * Find todos by date and completion status for a user
     */
    List<AdminTodo> findByUserIdAndTodoDateAndCompleted(Long userId, LocalDate todoDate, Boolean completed);

    /**
     * Count todos by user and completion status
     */
    long countByUserIdAndCompleted(Long userId, Boolean completed);

    /**
     * Find todos by category for a user
     */
    List<AdminTodo> findByUserIdAndCategory(Long userId, String category);

    /**
     * Find all todos for a specific date (across all users)
     */
    List<AdminTodo> findByTodoDate(LocalDate todoDate);
}

