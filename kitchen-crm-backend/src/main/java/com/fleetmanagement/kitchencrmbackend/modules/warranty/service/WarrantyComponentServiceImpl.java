package com.fleetmanagement.kitchencrmbackend.modules.warranty.service;

import com.fleetmanagement.kitchencrmbackend.modules.warranty.dto.WarrantyComponentDto;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.entity.WarrantyComponent;
import com.fleetmanagement.kitchencrmbackend.modules.warranty.repository.WarrantyComponentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarrantyComponentServiceImpl implements WarrantyComponentService {

    @Autowired
    private WarrantyComponentRepository warrantyComponentRepository;

    @Override
    public List<WarrantyComponentDto> getAllActiveComponents() {
        return warrantyComponentRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<WarrantyComponentDto> getAllComponents() {
        return warrantyComponentRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WarrantyComponentDto createComponent(WarrantyComponentDto dto) {
        WarrantyComponent component = new WarrantyComponent();
        component.setComponentName(dto.getComponentName());
        component.setWarrantyPeriod(dto.getWarrantyPeriod());
        component.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0);
        component.setActive(dto.getActive() != null ? dto.getActive() : true);
        
        WarrantyComponent saved = warrantyComponentRepository.save(component);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public WarrantyComponentDto updateComponent(Long id, WarrantyComponentDto dto) {
        WarrantyComponent component = warrantyComponentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warranty component not found: " + id));
        
        component.setComponentName(dto.getComponentName());
        component.setWarrantyPeriod(dto.getWarrantyPeriod());
        if (dto.getDisplayOrder() != null) {
            component.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getActive() != null) {
            component.setActive(dto.getActive());
        }
        
        WarrantyComponent saved = warrantyComponentRepository.save(component);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public void deleteComponent(Long id) {
        WarrantyComponent component = warrantyComponentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warranty component not found: " + id));
        
        component.setActive(false);
        warrantyComponentRepository.save(component);
    }

    @Override
    @Transactional
    public void reorderComponents(List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            WarrantyComponent component = warrantyComponentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Warranty component not found: " + id));
            component.setDisplayOrder(i + 1);
            warrantyComponentRepository.save(component);
        }
    }

    private WarrantyComponentDto convertToDto(WarrantyComponent component) {
        return WarrantyComponentDto.builder()
                .id(component.getId())
                .componentName(component.getComponentName())
                .warrantyPeriod(component.getWarrantyPeriod())
                .displayOrder(component.getDisplayOrder())
                .active(component.getActive())
                .createdAt(component.getCreatedAt())
                .updatedAt(component.getUpdatedAt())
                .build();
    }
}


