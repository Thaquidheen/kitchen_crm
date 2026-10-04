package com.fleetmanagement.kitchencrmbackend.modules.design.repository;

import com.fleetmanagement.kitchencrmbackend.modules.design.entity.DesignPhaseVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DesignPhaseVersionRepository extends JpaRepository<DesignPhaseVersion, Long> {

    /** Every version of the given designs in one round trip, oldest first. */
    @Query("SELECT v FROM DesignPhaseVersion v WHERE v.designPhase.id IN :jobIds ORDER BY v.versionNo ASC")
    List<DesignPhaseVersion> findForJobs(@Param("jobIds") Collection<Long> jobIds);

    @Query("SELECT v FROM DesignPhaseVersion v WHERE v.designPhase.id = :jobId AND v.versionNo = :versionNo")
    Optional<DesignPhaseVersion> findVersion(@Param("jobId") Long jobId, @Param("versionNo") Integer versionNo);
}
