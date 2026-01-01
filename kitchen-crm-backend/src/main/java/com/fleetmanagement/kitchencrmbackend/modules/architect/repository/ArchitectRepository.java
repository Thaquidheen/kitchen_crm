package com.fleetmanagement.kitchencrmbackend.modules.architect.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArchitectRepository extends JpaRepository<Architect, Long> {

    /**
     * Search architects by architecture name (case-insensitive, partial match)
     */
    Page<Architect> findByArchitectureNameContainingIgnoreCase(String name, Pageable pageable);

    /**
     * Search architects by firm (case-insensitive, partial match)
     */
    Page<Architect> findByFirmContainingIgnoreCase(String firm, Pageable pageable);

    /**
     * Find architects that have been visited (lastVisitDate is not null)
     */
    Page<Architect> findByLastVisitDateIsNotNull(Pageable pageable);

    /**
     * Find architects that have not been visited (lastVisitDate is null)
     */
    Page<Architect> findByLastVisitDateIsNull(Pageable pageable);
}




