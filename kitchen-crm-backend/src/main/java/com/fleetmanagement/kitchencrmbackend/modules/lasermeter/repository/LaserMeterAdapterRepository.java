package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.repository;

import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.entity.LaserMeterAdapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LaserMeterAdapterRepository extends JpaRepository<LaserMeterAdapter, Long> {

    List<LaserMeterAdapter> findAllByOrderByDisplayNameAsc();

    List<LaserMeterAdapter> findByActiveTrueOrderByDisplayNameAsc();

    Optional<LaserMeterAdapter> findByAdapterKey(String adapterKey);

    boolean existsByAdapterKey(String adapterKey);
}
