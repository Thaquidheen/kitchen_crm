package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByActiveTrue();
    List<Driver> findByWattage(Integer wattage);
}