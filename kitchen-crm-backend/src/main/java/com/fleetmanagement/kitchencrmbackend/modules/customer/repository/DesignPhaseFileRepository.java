package com.fleetmanagement.kitchencrmbackend.modules.customer.repository;

import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.DesignPhaseFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DesignPhaseFileRepository extends JpaRepository<DesignPhaseFile, Long> {

    List<DesignPhaseFile> findByDesignPhaseId(Long designPhaseId);

    List<DesignPhaseFile> findByDesignPhaseIdAndFileCategory(Long designPhaseId, DesignPhaseFile.FileCategory fileCategory);

    @Query("SELECT f FROM DesignPhaseFile f WHERE f.designPhase.customer.id = :customerId")
    List<DesignPhaseFile> findByCustomerId(@Param("customerId") Long customerId);

    Long countByDesignPhaseId(Long designPhaseId);
}
