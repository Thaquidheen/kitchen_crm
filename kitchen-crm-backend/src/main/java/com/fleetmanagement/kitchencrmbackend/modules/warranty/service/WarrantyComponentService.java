package com.fleetmanagement.kitchencrmbackend.modules.warranty.service;

import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyComponentDto;

import java.util.List;

public interface WarrantyComponentService {
    
    List<WarrantyComponentDto> getAllActiveComponents();
    
    List<WarrantyComponentDto> getAllComponents();
    
    WarrantyComponentDto createComponent(WarrantyComponentDto dto);
    
    WarrantyComponentDto updateComponent(Long id, WarrantyComponentDto dto);
    
    void deleteComponent(Long id);
    
    void reorderComponents(List<Long> orderedIds);
}


