package com.fleetmanagement.kitchencrmbackend.modules.warranty.service;

import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyCardDto;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyCardResponse;
import org.springframework.core.io.Resource;

public interface WarrantyCardService {
    
    WarrantyCardResponse getWarrantyCardByCustomerId(Long customerId);
    
    WarrantyCardResponse getWarrantyCardById(Long warrantyCardId);
    
    WarrantyCardResponse createWarrantyCard(Long customerId, WarrantyCardDto dto, String createdBy);
    
    WarrantyCardResponse updateWarrantyCard(Long warrantyCardId, WarrantyCardDto dto, String updatedBy);
    
    void generatePdf(Long warrantyCardId);
    
    Resource getWarrantyCardPdf(Long warrantyCardId);
    
    void sendEmail(Long warrantyCardId);
    
    String generateCertificateNumber();
}

