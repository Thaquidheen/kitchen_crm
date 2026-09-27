package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.repository;

import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity.DeviceLabLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceLabLogRepository extends JpaRepository<DeviceLabLog, Long> {

    List<DeviceLabLog> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}
