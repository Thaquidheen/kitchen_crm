package com.fleetmanagement.kitchencrmbackend.modules.task.repository;

import com.fleetmanagement.kitchencrmbackend.modules.task.entity.EmployeeTaskReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface EmployeeTaskReplyRepository extends JpaRepository<EmployeeTaskReply, Long> {

    /** Every reply of the given tasks in one round trip (lists attach threads to their tasks). */
    @Query("SELECT r FROM EmployeeTaskReply r WHERE r.task.id IN :taskIds ORDER BY r.createdAt ASC, r.id ASC")
    List<EmployeeTaskReply> findForTasks(@Param("taskIds") Collection<Long> taskIds);
}
