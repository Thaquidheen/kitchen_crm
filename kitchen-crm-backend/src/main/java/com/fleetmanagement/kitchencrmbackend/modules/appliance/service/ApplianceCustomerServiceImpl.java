package com.fleetmanagement.kitchencrmbackend.modules.appliance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceCustomerDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomerItem;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.repository.ApplianceCustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ApplianceCustomerServiceImpl implements ApplianceCustomerService {

    @Autowired
    private ApplianceCustomerRepository repository;

    @Override
    public ApiResponse<Page<ApplianceCustomerDto>> getAll(ApplianceCustomer.Category category,
                                                          ApplianceCustomer.Status status,
                                                          String search, Pageable pageable) {
        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<ApplianceCustomerDto> page = repository.findByFilters(category, status, normalizedSearch, pageable)
                .map(this::convertToDto);
        return ApiResponse.success(page);
    }

    @Override
    public ApiResponse<ApplianceCustomerDto> getById(Long id) {
        ApplianceCustomer entity = repository.findById(id).orElse(null);
        if (entity == null) {
            return ApiResponse.error("Entry not found");
        }
        return ApiResponse.success(convertToDto(entity));
    }

    @Override
    public ApiResponse<ApplianceCustomerDto> create(ApplianceCustomerDto dto, String createdBy) {
        ApplianceCustomer entity = new ApplianceCustomer();
        applyDto(entity, dto);
        entity.setCreatedBy(createdBy);
        return ApiResponse.success("Entry created", convertToDto(repository.save(entity)));
    }

    @Override
    public ApiResponse<ApplianceCustomerDto> update(Long id, ApplianceCustomerDto dto) {
        ApplianceCustomer entity = repository.findById(id).orElse(null);
        if (entity == null) {
            return ApiResponse.error("Entry not found");
        }
        applyDto(entity, dto);
        return ApiResponse.success("Entry updated", convertToDto(repository.save(entity)));
    }

    @Override
    public ApiResponse<String> delete(Long id) {
        if (!repository.existsById(id)) {
            return ApiResponse.error("Entry not found");
        }
        repository.deleteById(id);
        return ApiResponse.success("Entry deleted");
    }

    @Override
    public ApiResponse<Map<String, Object>> getStatistics(ApplianceCustomer.Category category) {
        Map<String, Object> stats = new HashMap<>();

        // Category chips always show the full picture, so these stay unscoped.
        stats.put("total", repository.count());
        stats.put("appliance", repository.countByCategory(ApplianceCustomer.Category.APPLIANCE));
        stats.put("quartz", repository.countByCategory(ApplianceCustomer.Category.QUARTZ));

        // Status chips and total value describe the rows currently listed, so they follow
        // the selected category (null category = everything).
        for (ApplianceCustomer.Status s : ApplianceCustomer.Status.values()) {
            stats.put(s.name().toLowerCase(), repository.countByCategoryAndStatus(category, s));
        }
        BigDecimal totalAmount = repository.getTotalAmount(category);
        stats.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        return ApiResponse.success(stats);
    }

    private void applyDto(ApplianceCustomer entity, ApplianceCustomerDto dto) {
        entity.setName(dto.getName());
        entity.setContact(dto.getContact());
        entity.setCategory(dto.getCategory() != null ? dto.getCategory() : ApplianceCustomer.Category.APPLIANCE);
        entity.setBrand(dto.getBrand());
        entity.setAmount(dto.getAmount());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : ApplianceCustomer.Status.LEAD);
        entity.setNotes(dto.getNotes());

        // Replace the manual item rows (orphanRemoval clears removed ones)
        entity.getItems().clear();
        if (dto.getItems() != null) {
            int order = 0;
            for (String itemName : dto.getItems()) {
                if (itemName == null || itemName.isBlank()) continue;
                ApplianceCustomerItem item = new ApplianceCustomerItem();
                item.setApplianceCustomer(entity);
                item.setItemName(itemName.trim());
                item.setSortOrder(order++);
                entity.getItems().add(item);
            }
        }
    }

    private ApplianceCustomerDto convertToDto(ApplianceCustomer entity) {
        ApplianceCustomerDto dto = new ApplianceCustomerDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setContact(entity.getContact());
        dto.setCategory(entity.getCategory());
        dto.setBrand(entity.getBrand());
        dto.setAmount(entity.getAmount());
        dto.setStatus(entity.getStatus());
        dto.setNotes(entity.getNotes());
        List<String> items = entity.getItems().stream().map(ApplianceCustomerItem::getItemName).toList();
        dto.setItems(items);
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
