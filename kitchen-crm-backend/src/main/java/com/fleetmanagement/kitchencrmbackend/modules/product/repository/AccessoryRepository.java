// AccessoryRepository.java
package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Accessory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessoryRepository extends JpaRepository<Accessory, Long> {
    List<Accessory> findByActiveTrue();
    List<Accessory> findByCategoryId(Long categoryId);
    List<Accessory> findByBrandId(Long brandId);
}