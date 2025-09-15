package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.CabinetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CabinetTypeRepository extends JpaRepository<CabinetType, Long> {
    List<CabinetType> findByActiveTrue();
    List<CabinetType> findByCategoryId(Long categoryId);
    List<CabinetType> findByBrandId(Long brandId);
    List<CabinetType> findByMaterialId(Long materialId);
}