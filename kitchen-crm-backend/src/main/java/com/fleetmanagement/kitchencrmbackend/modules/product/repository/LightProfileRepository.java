package com.fleetmanagement.kitchencrmbackend.modules.product.repository;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.LightProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LightProfileRepository extends JpaRepository<LightProfile, Long> {
    List<LightProfile> findByActiveTrue();
    List<LightProfile> findByProfileType(LightProfile.ProfileType profileType);
}