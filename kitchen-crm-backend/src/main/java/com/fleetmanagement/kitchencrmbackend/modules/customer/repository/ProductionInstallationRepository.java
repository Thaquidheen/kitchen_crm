package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.ProductionInstallation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionInstallationRepository extends JpaRepository<ProductionInstallation, Long> {

    Optional<ProductionInstallation> findByCustomerId(Long customerId);

    List<ProductionInstallation> findByOverallStatus(ProductionInstallation.InstallationStatus status);

    List<ProductionInstallation> findByProjectManagerAssigned(String projectManagerAssigned);

    List<ProductionInstallation> findByInstallationTeamLead(String installationTeamLead);

    long countByOverallStatus(ProductionInstallation.InstallationStatus status);

    @Query("SELECT p FROM ProductionInstallation p WHERE " +
            "(:status IS NULL OR p.overallStatus = :status) AND " +
            "(:projectManager IS NULL OR LOWER(p.projectManagerAssigned) LIKE LOWER(CONCAT('%', :projectManager, '%'))) AND " +
            "(:teamLead IS NULL OR LOWER(p.installationTeamLead) LIKE LOWER(CONCAT('%', :teamLead, '%'))) AND " +
            "(:customerName IS NULL OR LOWER(p.customer.name) LIKE LOWER(CONCAT('%', :customerName, '%')))")
    Page<ProductionInstallation> findByFilters(@Param("status") ProductionInstallation.InstallationStatus status,
                                               @Param("projectManager") String projectManager,
                                               @Param("teamLead") String teamLead,
                                               @Param("customerName") String customerName,
                                               Pageable pageable);

    @Query("SELECT p FROM ProductionInstallation p WHERE p.estimatedCompletionDate BETWEEN :fromDate AND :toDate")
    List<ProductionInstallation> findByEstimatedCompletionDateBetween(@Param("fromDate") LocalDate fromDate,
                                                                      @Param("toDate") LocalDate toDate);

    @Query("SELECT p FROM ProductionInstallation p WHERE p.estimatedCompletionDate < :date AND p.overallStatus NOT IN ('COMPLETED', 'CANCELLED')")
    List<ProductionInstallation> findOverdueProjects(@Param("date") LocalDate date);

    @Query("SELECT p FROM ProductionInstallation p WHERE p.siteVisitMarking = true AND p.flooringCompleted = true AND p.ceilingCompleted = true AND p.carcassAtSite = true AND p.countertopAtSite = true AND p.shuttersAtSite = true AND p.carcassInstalled = false")
    List<ProductionInstallation> findReadyForInstallation();

    @Query("SELECT p FROM ProductionInstallation p WHERE p.qualityCheckPassed = true AND p.handoverToClient = false")
    List<ProductionInstallation> findReadyForHandover();

    @Query("SELECT p FROM ProductionInstallation p WHERE p.epdReceived = true AND p.productionStarted = false")
    List<ProductionInstallation> findReadyForProduction();
}