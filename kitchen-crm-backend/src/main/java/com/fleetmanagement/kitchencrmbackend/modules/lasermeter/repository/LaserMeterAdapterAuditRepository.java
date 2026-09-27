package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.repository;

import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity.LaserMeterAdapterAudit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaserMeterAdapterAuditRepository extends JpaRepository<LaserMeterAdapterAudit, Long> {

    List<LaserMeterAdapterAudit> findByAdapterIdOrderByCreatedAtDescIdDesc(Long adapterId);

    List<LaserMeterAdapterAudit> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}
