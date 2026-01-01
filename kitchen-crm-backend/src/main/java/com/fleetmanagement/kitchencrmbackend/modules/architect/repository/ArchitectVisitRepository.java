package com.fleetmanagement.kitchencrmbackend.modules.architect.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.ArchitectVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArchitectVisitRepository extends JpaRepository<ArchitectVisit, Long> {

    /**
     * Get all visits for an architect, ordered by visit date descending (most recent first)
     */
    List<ArchitectVisit> findByArchitectIdOrderByVisitDateDesc(Long architectId);

    /**
     * Get the most recent visit for an architect
     */
    Optional<ArchitectVisit> findFirstByArchitectIdOrderByVisitDateDesc(Long architectId);

    /**
     * Count visits for an architect
     */
    long countByArchitectId(Long architectId);
}

