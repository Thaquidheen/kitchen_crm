package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, Long> {
    List<Sensor> findByActiveTrue();
    List<Sensor> findByType(Sensor.SensorType type);
}