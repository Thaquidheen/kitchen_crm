package com.fleetmanagement.kitchencrmbackend.modules.design.repository;

import com.fleetmanagement.kitchencrmbackend.modules.design.entity.DesignPhaseNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface DesignPhaseNoteRepository extends JpaRepository<DesignPhaseNote, Long> {

    /** Every note of the given jobs in one round trip, oldest first. */
    @Query("SELECT n FROM DesignPhaseNote n WHERE n.designPhase.id IN :jobIds ORDER BY n.createdAt ASC, n.id ASC")
    List<DesignPhaseNote> findForJobs(@Param("jobIds") Collection<Long> jobIds);
}
