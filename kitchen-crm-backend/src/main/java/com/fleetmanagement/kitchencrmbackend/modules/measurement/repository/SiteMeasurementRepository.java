package com.fleetmanagement.kitchencrmbackend.modules.measurement.repository;

import com.fleetmanagement.kitchencrmbackend.modules.measurement.entity.SiteMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SiteMeasurementRepository extends JpaRepository<SiteMeasurement, Long> {

    Optional<SiteMeasurement> findByCustomerId(Long customerId);
}
