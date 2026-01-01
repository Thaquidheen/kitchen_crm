package com.fleetmanagement.kitchencrmbackend.modules.warranty.repository;

import com.fleetmanagement.kitchencrmbackend.modules.warranty.entity.WarrantyCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WarrantyCardRepository extends JpaRepository<WarrantyCard, Long> {
    
    Optional<WarrantyCard> findByCustomerId(Long customerId);
    
    Optional<WarrantyCard> findByCertificateNumber(String certificateNumber);
    
    boolean existsByCustomerId(Long customerId);
}


