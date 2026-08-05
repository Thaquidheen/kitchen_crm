package com.fleetmanagement.kitchencrmbackend.modules.appliance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceCustomerDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceQuotationFileDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomerItem;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceQuotationFile;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.repository.ApplianceCustomerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class ApplianceCustomerServiceImpl implements ApplianceCustomerService {

    @Value("${app.appliance-quotation-upload-dir:uploads/appliance-quotations}")
    private String quotationUploadDir;

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

    @Override
    public ApiResponse<ApplianceCustomerDto> uploadQuotations(Long id, MultipartFile[] files) {
        ApplianceCustomer entity = repository.findById(id).orElse(null);
        if (entity == null) {
            return ApiResponse.error("Entry not found");
        }
        if (files == null || files.length == 0) {
            return ApiResponse.error("Please choose at least one file to upload");
        }

        // Validate everything up front so a bad file in the batch does not leave half of it stored.
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                return ApiResponse.error("One of the selected files is empty");
            }
            String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
            if (!name.toLowerCase().endsWith(".pdf")) {
                return ApiResponse.error("Only PDF files can be attached — \"" + name + "\" is not a PDF");
            }
            if (file.getSize() > 20L * 1024 * 1024) {
                return ApiResponse.error("\"" + name + "\" is too large (maximum 20MB)");
            }
        }

        try {
            Path dir = Paths.get(quotationUploadDir);
            Files.createDirectories(dir);

            int i = 0;
            for (MultipartFile file : files) {
                String original = file.getOriginalFilename() == null ? "quotation.pdf" : file.getOriginalFilename();
                // Stored name is ours, never the client's, and unique within the batch.
                String stored = "appliance-" + id + "-" + System.currentTimeMillis() + "-" + (i++) + ".pdf";
                Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);

                ApplianceQuotationFile record = new ApplianceQuotationFile();
                record.setApplianceCustomer(entity);
                record.setFileUrl("/uploads/appliance-quotations/" + stored);
                record.setFileName(original);
                record.setUploadedAt(LocalDateTime.now());
                entity.getQuotationFiles().add(record);
            }

            String msg = files.length == 1 ? "Quotation uploaded" : files.length + " quotations uploaded";
            return ApiResponse.success(msg, convertToDto(repository.save(entity)));
        } catch (IOException e) {
            return ApiResponse.error("Failed to store the file: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<ApplianceCustomerDto> deleteQuotation(Long id, Long fileId) {
        ApplianceCustomer entity = repository.findById(id).orElse(null);
        if (entity == null) {
            return ApiResponse.error("Entry not found");
        }
        ApplianceQuotationFile target = entity.getQuotationFiles().stream()
                .filter(f -> f.getId().equals(fileId))
                .findFirst()
                .orElse(null);
        if (target == null) {
            return ApiResponse.error("Quotation file not found on this entry");
        }
        deleteStoredQuotation(target.getFileUrl());
        entity.getQuotationFiles().remove(target); // orphanRemoval deletes the row
        return ApiResponse.success("Quotation removed", convertToDto(repository.save(entity)));
    }

    private void deleteStoredQuotation(String url) {
        if (url == null || url.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(quotationUploadDir, Paths.get(url).getFileName().toString()));
        } catch (Exception e) {
            // A leftover file is not worth failing the request over.
            log.warn("Could not delete previous quotation file {}: {}", url, e.getMessage());
        }
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
        dto.setQuotationFiles(entity.getQuotationFiles().stream()
                .map(f -> new ApplianceQuotationFileDto(f.getId(), f.getFileUrl(), f.getFileName(), f.getUploadedAt()))
                .toList());
        List<String> items = entity.getItems().stream().map(ApplianceCustomerItem::getItemName).toList();
        dto.setItems(items);
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
