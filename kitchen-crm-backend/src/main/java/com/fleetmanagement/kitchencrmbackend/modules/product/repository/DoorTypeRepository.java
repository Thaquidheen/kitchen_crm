package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.DoorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoorTypeRepository extends JpaRepository<DoorType, Long> {
    List<DoorType> findByActiveTrue();
    List<DoorType> findByBrandId(Long brandId);
    List<DoorType> findByMaterial(String material);
}