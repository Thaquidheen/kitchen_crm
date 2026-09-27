package com.fleetmanagement.kitchencrmbackend.modules.architect.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.ArchitectNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArchitectNoteRepository extends JpaRepository<ArchitectNote, Long> {
    /** Newest first, matching the customer notes feed. */
    List<ArchitectNote> findByArchitectIdOrderByCreatedAtDescIdDesc(Long architectId);

    /** Creator-scoped: ViewerScope.ALL (-1) sees every note, any other value only that user's. */
    @org.springframework.data.jpa.repository.Query(
            "SELECT n FROM ArchitectNote n WHERE n.architect.id = :architectId "
            + "AND (:viewerId = -1 OR n.createdByUserId = :viewerId) ORDER BY n.createdAt DESC, n.id DESC")
    List<ArchitectNote> findForArchitect(
            @org.springframework.data.repository.query.Param("architectId") Long architectId,
            @org.springframework.data.repository.query.Param("viewerId") long viewerId);
}
