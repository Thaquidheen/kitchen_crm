package com.fleetmanagement.kitchencrmbackend.modules.architect.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.ArchitectNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchitectNoteRepository extends JpaRepository<ArchitectNote, Long> {
    /** Newest first, matching the customer notes feed. */
    List<ArchitectNote> findByArchitectIdOrderByCreatedAtDescIdDesc(Long architectId);
}
