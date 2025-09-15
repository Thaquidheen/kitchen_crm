package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    Optional<Material> findByName(String name);
    List<Material> findByActiveTrue();
    Boolean existsByName(String name);
}