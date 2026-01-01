package com.fleetmanagement.kitchencrmbackend.modules.warranty.repository;

import com.fleetmanagement.kitchencrmbackend.modules.warranty.entity.WarrantyComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarrantyComponentRepository extends JpaRepository<WarrantyComponent, Long> {
    
    List<WarrantyComponent> findByActiveTrueOrderByDisplayOrderAsc();
    
    List<WarrantyComponent> findAllByOrderByDisplayOrderAsc();
}


