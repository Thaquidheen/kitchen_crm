package com.fleetmanagement.kitchencrmbackend.modules.architect.repository;

import com.fleetmanagement.kitchencrmbackend.modules.architect.entity.Architect;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArchitectRepository extends JpaRepository<Architect, Long> {

    /**
     * One query covering every combination of the three filters, replacing the four narrow
     * finders this repository used to expose — which would have become eight combinations once
     * partner type was added. Same shape as ApplianceCustomerRepository.findByFilters.
     *
     * <p>Search is a genuine OR across name/firm/principal/contact. The previous implementation
     * searched by name and only fell back to firm when the name search returned nothing, so a
     * term matching a single record by name hid every firm match.
     */
    @Query("SELECT a FROM Architect a WHERE " +
            "(:partnerType IS NULL OR a.partnerType = :partnerType) AND " +
            "(:visited IS NULL " +
            " OR (:visited = TRUE AND a.lastVisitDate IS NOT NULL) " +
            " OR (:visited = FALSE AND a.lastVisitDate IS NULL)) AND " +
            "(:search IS NULL " +
            " OR LOWER(a.architectureName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            " OR LOWER(a.firm) LIKE LOWER(CONCAT('%', :search, '%')) " +
            " OR LOWER(a.principalArchitectName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            " OR LOWER(a.contactNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Architect> findByFilters(@Param("partnerType") Architect.PartnerType partnerType,
                                  @Param("visited") Boolean visited,
                                  @Param("search") String search,
                                  Pageable pageable);

    /** Unpaginated list for the customer form's architect/builder picker. */
    @Query("SELECT a FROM Architect a WHERE (:partnerType IS NULL OR a.partnerType = :partnerType) " +
            "ORDER BY a.architectureName ASC")
    List<Architect> findAllByPartnerType(@Param("partnerType") Architect.PartnerType partnerType);

    /**
     * Backs the soft dedupe in createArchitect: typing a name that already exists in the
     * customer form's picker must link that record rather than silently creating a second one.
     * Indexed by idx_architects_partner_type_name (V91).
     */
    Optional<Architect> findFirstByPartnerTypeAndArchitectureNameIgnoreCase(
            Architect.PartnerType partnerType, String architectureName);
}
