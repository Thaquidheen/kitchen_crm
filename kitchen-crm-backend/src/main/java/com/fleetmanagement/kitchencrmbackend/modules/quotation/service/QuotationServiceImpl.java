package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Accessory;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.LightProfileRepository;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.DriverRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.ConnectorRepository;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.SensorRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class QuotationServiceImpl implements QuotationService {

    @Autowired
    private QuotationRepository quotationRepository;

    @Autowired
    private QuotationAccessoryRepository accessoryRepository;

    @Autowired
    private QuotationCabinetRepository cabinetRepository;

    @Autowired
    private QuotationDoorRepository doorRepository;

    @Autowired
    private QuotationLightingRepository lightingRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private ConnectorRepository connectorRepository;

    @Autowired
    private SensorRepository sensorRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PricingService pricingService;
    @Autowired
    private LightProfileRepository lightProfileRepository;

    @Override
    public ApiResponse<Page<QuotationSummaryDto>> getAllQuotations(Long customerId, Quotation.QuotationStatus status,
                                                                   String customerName, LocalDateTime fromDate,
                                                                   LocalDateTime toDate, Pageable pageable) {
        Page<Quotation> quotations = quotationRepository.findByFilters(customerId, status, customerName, fromDate, toDate, pageable);
        Page<QuotationSummaryDto> quotationDtos = quotations.map(this::convertToSummaryDto);
        return ApiResponse.success(quotationDtos);
    }

    @Override
    public ApiResponse<QuotationDto> getQuotationById(Long id, String userRole) {
        Quotation quotation = quotationRepository.findById(id).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        QuotationDto dto = convertToDto(quotation, userRole);
        return ApiResponse.success(dto);
    }

    @Override
    @Transactional
    public ApiResponse<QuotationDto> createQuotation(QuotationCreateDto dto, String createdBy, String userRole) {
        try {
            // Validate customer exists
            Customer customer = customerRepository.findById(dto.getCustomerId()).orElse(null);
            if (customer == null) {
                return ApiResponse.error("Customer not found");
            }

            // Create quotation
            Quotation quotation = new Quotation();
            quotation.setCustomer(customer);
            quotation.setProjectName(dto.getProjectName());
            quotation.setValidUntil(dto.getValidUntil());
            quotation.setNotes(dto.getNotes());
            quotation.setTermsConditions(dto.getTermsConditions());

            // Set the createdBy field using the parameter
            quotation.setCreatedBy(createdBy);
            quotation.setStatus(Quotation.QuotationStatus.DRAFT);

            // Set default values
            quotation.setMarginPercentage(dto.getMarginPercentage() != null ? dto.getMarginPercentage() : BigDecimal.ZERO);
            quotation.setTaxPercentage(dto.getTaxPercentage() != null ? dto.getTaxPercentage() : BigDecimal.valueOf(18.0));
            quotation.setTransportationPrice(dto.getTransportationPrice() != null ? dto.getTransportationPrice() : BigDecimal.ZERO);
            quotation.setInstallationPrice(dto.getInstallationPrice() != null ? dto.getInstallationPrice() : BigDecimal.ZERO);

            // Save quotation first to get ID
            Quotation savedQuotation = quotationRepository.save(quotation);

            // Save line items using your existing method
            saveLineItems(savedQuotation, dto, userRole);

            // Calculate totals using your existing method
            calculateQuotationTotals(savedQuotation);
            quotationRepository.save(savedQuotation);

            return ApiResponse.success("Quotation created successfully", convertToDto(savedQuotation, userRole));

        } catch (Exception e) {
            e.printStackTrace();
            return ApiResponse.error("Failed to create quotation: " + e.getMessage());
        }
    }


    @Override
    public ApiResponse<QuotationDto> updateQuotation(Long id, QuotationDto quotationDto, String updatedBy, String userRole) {
        Quotation existingQuotation = quotationRepository.findById(id).orElse(null);
        if (existingQuotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        // Check if quotation can be updated
        if (existingQuotation.getStatus() == Quotation.QuotationStatus.APPROVED) {
            return ApiResponse.error("Cannot update approved quotation");
        }

        // Update quotation fields
        existingQuotation.setProjectName(quotationDto.getProjectName());
        existingQuotation.setTransportationPrice(quotationDto.getTransportationPrice());
        existingQuotation.setInstallationPrice(quotationDto.getInstallationPrice());
        existingQuotation.setMarginPercentage(quotationDto.getMarginPercentage());
        existingQuotation.setTaxPercentage(quotationDto.getTaxPercentage());
        existingQuotation.setValidUntil(quotationDto.getValidUntil());
        existingQuotation.setNotes(quotationDto.getNotes());
        existingQuotation.setTermsConditions(quotationDto.getTermsConditions());

        // Delete existing line items and save new ones
        deleteExistingLineItems(id);

        QuotationCreateDto createDto = new QuotationCreateDto();
        createDto.setAccessories(quotationDto.getAccessories());
        createDto.setCabinets(quotationDto.getCabinets());
        createDto.setDoors(quotationDto.getDoors());
        createDto.setLighting(quotationDto.getLighting());

        saveLineItems(existingQuotation, createDto, userRole);

        // Recalculate totals
        calculateQuotationTotals(existingQuotation);
        Quotation updatedQuotation = quotationRepository.save(existingQuotation);

        return ApiResponse.success("Quotation updated successfully", convertToDto(updatedQuotation, userRole));
    }

    @Override
    public ApiResponse<String> deleteQuotation(Long id) {
        Quotation quotation = quotationRepository.findById(id).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        if (quotation.getStatus() == Quotation.QuotationStatus.APPROVED) {
            return ApiResponse.error("Cannot delete approved quotation");
        }

        deleteExistingLineItems(id);
        quotationRepository.delete(quotation);
        return ApiResponse.success("Quotation deleted successfully");
    }

    @Override
    public ApiResponse<String> updateQuotationStatus(Long id, Quotation.QuotationStatus newStatus, String updatedBy) {
        Quotation quotation = quotationRepository.findById(id).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        quotation.setStatus(newStatus);
        if (newStatus == Quotation.QuotationStatus.APPROVED) {
            quotation.setApprovedBy(updatedBy);
            quotation.setApprovedAt(LocalDate.now());
        }

        quotationRepository.save(quotation);
        return ApiResponse.success("Quotation status updated successfully");
    }

    @Override
    public ApiResponse<QuotationDto> duplicateQuotation(Long id, String createdBy, String userRole) {
        Quotation originalQuotation = quotationRepository.findById(id).orElse(null);
        if (originalQuotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        // Create new quotation
        Quotation newQuotation = new Quotation();
        newQuotation.setCustomer(originalQuotation.getCustomer());
        newQuotation.setProjectName(originalQuotation.getProjectName() + " (Copy)");
        newQuotation.setTransportationPrice(originalQuotation.getTransportationPrice());
        newQuotation.setInstallationPrice(originalQuotation.getInstallationPrice());
        newQuotation.setMarginPercentage(originalQuotation.getMarginPercentage());
        newQuotation.setTaxPercentage(originalQuotation.getTaxPercentage());
        newQuotation.setNotes(originalQuotation.getNotes());
        newQuotation.setTermsConditions(originalQuotation.getTermsConditions());
        newQuotation.setCreatedBy(createdBy);
        newQuotation.setStatus(Quotation.QuotationStatus.DRAFT);

        Quotation savedQuotation = quotationRepository.save(newQuotation);

        // Duplicate line items
        duplicateLineItems(originalQuotation.getId(), savedQuotation);

        // Calculate totals
        calculateQuotationTotals(savedQuotation);
        quotationRepository.save(savedQuotation);

        return ApiResponse.success("Quotation duplicated successfully", convertToDto(savedQuotation, userRole));
    }

    @Override
    public ApiResponse<Map<String, Object>> getQuotationStatistics() {
        Map<String, Object> stats = new HashMap<>();

        for (Quotation.QuotationStatus status : Quotation.QuotationStatus.values()) {
            Long count = quotationRepository.countByStatus(status);
            stats.put(status.name().toLowerCase(), count);
        }

        stats.put("total", quotationRepository.count());
        BigDecimal totalApproved = quotationRepository.getTotalApprovedAmount();
        stats.put("totalApprovedAmount", totalApproved != null ? totalApproved : BigDecimal.ZERO);

        return ApiResponse.success(stats);
    }
    private void createLightingEntries(Quotation quotation, List<QuotationLightingDto> lightingItems) {
        if (lightingItems == null || lightingItems.isEmpty()) {
            return;
        }

        for (QuotationLightingDto lightingDto : lightingItems) {
            QuotationLighting lighting = new QuotationLighting();
            lighting.setQuotation(quotation);
            lighting.setItemType(QuotationLighting.LightingItemType.valueOf(lightingDto.getItemType()));
            lighting.setItemId(lightingDto.getItemId());
            lighting.setQuantity(lightingDto.getQuantity());
            lighting.setUnitPrice(lightingDto.getUnitPrice());



            // Fetch and populate item details based on type
            populateLightingItemDetails(lighting, lightingDto.getItemType(), lightingDto.getItemId());

            // Calculate pricing
            pricingService.calculateLightingLineTotal(lighting, quotation.getMarginPercentage(), quotation.getTaxPercentage());

            // Add to quotation's lighting list
            quotation.getLighting().add(lighting);
        }
    }

    private void populateLightingItemDetails(QuotationLighting lighting, String itemType, Long itemId) {
        try {
            switch (itemType) {
                case "LIGHT_PROFILE":
                    lightProfileRepository.findById(itemId).ifPresentOrElse(profile -> {
                        lighting.setItemName("LED Profile " + profile.getProfileType());
                        lighting.setUnit("METER");
                        lighting.setProfileType(profile.getProfileType().toString());
                        lighting.setDescription("LED Profile Type " + profile.getProfileType());
                    }, () -> {
                        // Fallback if profile not found
                        lighting.setItemName("LED Profile - Item ID: " + itemId);
                        lighting.setUnit("METER");
                        lighting.setDescription("LED Profile");
                    });
                    break;

                case "DRIVER":
                    driverRepository.findById(itemId).ifPresentOrElse(driver -> {
                        lighting.setItemName(driver.getWattage() + "W LED Driver");
                        lighting.setUnit("PIECE");
                        lighting.setWattage(driver.getWattage());
                        lighting.setDescription(driver.getWattage() + "W LED Driver");
                    }, () -> {
                        // Fallback if driver not found
                        lighting.setItemName("LED Driver - Item ID: " + itemId);
                        lighting.setUnit("PIECE");
                        lighting.setDescription("LED Driver");
                    });
                    break;

                case "CONNECTOR":
                    connectorRepository.findById(itemId).ifPresentOrElse(connector -> {
                        lighting.setItemName(connector.getType().toString() + " Connector");
                        lighting.setUnit("PIECE");
                        lighting.setConnectorType(connector.getType().toString());
                        lighting.setDescription(connector.getType().toString() + " LED Connector");
                    }, () -> {
                        // Fallback if connector not found
                        lighting.setItemName("LED Connector - Item ID: " + itemId);
                        lighting.setUnit("PIECE");
                        lighting.setDescription("LED Connector");
                    });
                    break;

                case "SENSOR":
                    sensorRepository.findById(itemId).ifPresentOrElse(sensor -> {
                        lighting.setItemName(sensor.getType().toString() + " Sensor");
                        lighting.setUnit("PIECE");
                        lighting.setSensorType(sensor.getType().toString());
                        lighting.setDescription(sensor.getType().toString() + " Motion Sensor");
                    }, () -> {
                        // Fallback if sensor not found
                        lighting.setItemName("Motion Sensor - Item ID: " + itemId);
                        lighting.setUnit("PIECE");
                        lighting.setDescription("Motion Sensor");
                    });
                    break;

                default:
                    // Fallback for unknown item types
                    lighting.setItemName("Unknown Item - ID: " + itemId);
                    lighting.setUnit("PIECE");
                    lighting.setDescription("Unknown lighting item");
            }
        } catch (Exception e) {
            // Log error and set fallback values
            System.err.println("Error populating lighting item details: " + e.getMessage());
            lighting.setItemName("Lighting Item - ID: " + itemId);
            lighting.setUnit("PIECE");
            lighting.setDescription("Lighting item");
        }
    }

    private void saveLineItems(Quotation quotation, QuotationCreateDto dto, String userRole) {
        // Save accessories
        if (dto.getAccessories() != null) {
            for (QuotationAccessoryDto accessoryDto : dto.getAccessories()) {
                QuotationAccessory accessory = new QuotationAccessory();
                accessory.setQuotation(quotation);
                accessory.setQuantity(accessoryDto.getQuantity());
                accessory.setUnitPrice(accessoryDto.getUnitPrice());
                accessory.setDescription(accessoryDto.getDescription());
                accessory.setCustomItem(accessoryDto.getCustomItem());
                accessory.setCustomItemName(accessoryDto.getCustomItemName());

                pricingService.calculateAccessoryLineTotal(accessory, quotation.getMarginPercentage(), quotation.getTaxPercentage());
                accessoryRepository.save(accessory);
            }
        }

        // Save cabinets
        if (dto.getCabinets() != null) {
            for (QuotationCabinetDto cabinetDto : dto.getCabinets()) {
                QuotationCabinet cabinet = new QuotationCabinet();
                cabinet.setQuotation(quotation);
                cabinet.setQuantity(cabinetDto.getQuantity());
                cabinet.setWidthMm(cabinetDto.getWidthMm());
                cabinet.setHeightMm(cabinetDto.getHeightMm());
                cabinet.setDepthMm(cabinetDto.getDepthMm());
                cabinet.setUnitPrice(cabinetDto.getUnitPrice());
                cabinet.setCustomDimensions(cabinetDto.getCustomDimensions() != null && cabinetDto.getCustomDimensions()
                        ? "true" : "false");

                pricingService.calculateCabinetLineTotal(cabinet, quotation.getMarginPercentage(), quotation.getTaxPercentage());
                cabinetRepository.save(cabinet);
            }
        }

        // Save doors
        if (dto.getDoors() != null) {
            for (QuotationDoorDto doorDto : dto.getDoors()) {
                QuotationDoor door = new QuotationDoor();
                door.setQuotation(quotation);
                door.setQuantity(doorDto.getQuantity());
                door.setWidthMm(doorDto.getWidthMm());
                door.setHeightMm(doorDto.getHeightMm());
                door.setUnitPrice(doorDto.getUnitPrice());
                door.setDoorFinish(doorDto.getDoorFinish());
                door.setDoorStyle(doorDto.getDoorStyle());
                door.setDescription(doorDto.getDescription());
                door.setCustomDimensions(doorDto.getCustomDimensions() != null ?
                        doorDto.getCustomDimensions().toString() : null);

                pricingService.calculateDoorLineTotal(door, quotation.getMarginPercentage(), quotation.getTaxPercentage());
                doorRepository.save(door);
            }
        }

        // Save lighting - THIS IS THE IMPORTANT PART FOR YOUR ISSUE
        if (dto.getLighting() != null) {
            for (QuotationLightingDto lightingDto : dto.getLighting()) {
                QuotationLighting lighting = new QuotationLighting();
                lighting.setQuotation(quotation);
                lighting.setItemType(QuotationLighting.LightingItemType.valueOf(lightingDto.getItemType()));
                lighting.setItemId(lightingDto.getItemId());
                lighting.setQuantity(lightingDto.getQuantity());
                lighting.setUnitPrice(lightingDto.getUnitPrice());



                // POPULATE ITEM DETAILS - This will set the item_name field properly
                populateLightingItemDetails(lighting, lightingDto.getItemType(), lightingDto.getItemId());

                pricingService.calculateLightingLineTotal(lighting, quotation.getMarginPercentage(), quotation.getTaxPercentage());
                lightingRepository.save(lighting);
            }
        }
    }

    private void deleteExistingLineItems(Long quotationId) {
        accessoryRepository.deleteByQuotationId(quotationId);
        cabinetRepository.deleteByQuotationId(quotationId);
        doorRepository.deleteByQuotationId(quotationId);
        lightingRepository.deleteByQuotationId(quotationId);
    }

    private void duplicateLineItems(Long originalQuotationId, Quotation newQuotation) {
        // Duplicate accessories
        List<QuotationAccessory> originalAccessories = accessoryRepository.findByQuotationId(originalQuotationId);
        for (QuotationAccessory original : originalAccessories) {
            QuotationAccessory copy = new QuotationAccessory();
            copy.setQuotation(newQuotation);
            copy.setAccessory(original.getAccessory());
            copy.setQuantity(original.getQuantity());
            copy.setUnitPrice(original.getUnitPrice());
            copy.setDescription(original.getDescription());
            copy.setCustomItem(original.getCustomItem());
            copy.setCustomItemName(original.getCustomItemName());

            copy.setTotalPrice(original.getTotalPrice());
            accessoryRepository.save(copy);
        }

        // Duplicate cabinets
        List<QuotationCabinet> originalCabinets = cabinetRepository.findByQuotationId(originalQuotationId);
        for (QuotationCabinet original : originalCabinets) {
            QuotationCabinet copy = new QuotationCabinet();
            copy.setQuotation(newQuotation);
            copy.setCabinetType(original.getCabinetType());
            copy.setQuantity(original.getQuantity());
            copy.setWidthMm(original.getWidthMm());
            copy.setHeightMm(original.getHeightMm());
            copy.setDepthMm(original.getDepthMm());
            copy.setCalculatedSqft(original.getCalculatedSqft());
            copy.setUnitPrice(original.getUnitPrice());

            copy.setTotalPrice(original.getTotalPrice());

            copy.setCustomDimensions(original.getCustomDimensions());
            cabinetRepository.save(copy);
        }

        // Duplicate doors
        List<QuotationDoor> originalDoors = doorRepository.findByQuotationId(originalQuotationId);
        for (QuotationDoor original : originalDoors) {
            QuotationDoor copy = new QuotationDoor();
            copy.setQuotation(newQuotation);
            copy.setDoorType(original.getDoorType());
            copy.setQuantity(original.getQuantity());
            copy.setWidthMm(original.getWidthMm());
            copy.setHeightMm(original.getHeightMm());
            copy.setCalculatedSqft(original.getCalculatedSqft());
            copy.setUnitPrice(original.getUnitPrice());

            copy.setTotalPrice(original.getTotalPrice());
            copy.setDoorFinish(original.getDoorFinish());
            copy.setDoorStyle(original.getDoorStyle());
            copy.setDescription(original.getDescription());
            copy.setCustomDimensions(original.getCustomDimensions());
            doorRepository.save(copy);
        }

        // Duplicate lighting
        List<QuotationLighting> originalLighting = lightingRepository.findByQuotationId(originalQuotationId);
        for (QuotationLighting original : originalLighting) {
            QuotationLighting copy = new QuotationLighting();
            copy.setQuotation(newQuotation);
            copy.setItemType(original.getItemType());
            copy.setItemId(original.getItemId());
            copy.setItemName(original.getItemName());
            copy.setQuantity(original.getQuantity());
            copy.setUnit(original.getUnit());
            copy.setUnitPrice(original.getUnitPrice());

            copy.setTotalPrice(original.getTotalPrice());
            copy.setSpecifications(original.getSpecifications());
            copy.setDescription(original.getDescription());
            copy.setWattage(original.getWattage());
            copy.setProfileType(original.getProfileType());
            copy.setSensorType(original.getSensorType());
            copy.setConnectorType(original.getConnectorType());
            lightingRepository.save(copy);
        }
    }

    private void calculateQuotationTotals(Quotation quotation) {
        BigDecimal subtotal = BigDecimal.ZERO;

        // Calculate line items total
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotation.getId());
        subtotal = subtotal.add(accessories.stream()
                .map(QuotationAccessory::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<QuotationCabinet> cabinets = cabinetRepository.findByQuotationId(quotation.getId());
        subtotal = subtotal.add(cabinets.stream()
                .map(QuotationCabinet::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<QuotationDoor> doors = doorRepository.findByQuotationId(quotation.getId());
        subtotal = subtotal.add(doors.stream()
                .map(QuotationDoor::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        List<QuotationLighting> lighting = lightingRepository.findByQuotationId(quotation.getId());
        subtotal = subtotal.add(lighting.stream()
                .map(QuotationLighting::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        // Add transportation and installation
        subtotal = subtotal.add(quotation.getTransportationPrice())
                .add(quotation.getInstallationPrice());

        // Calculate margin and tax on base amount (before margin)
        BigDecimal baseAmount = subtotal.subtract(quotation.getTransportationPrice())
                .subtract(quotation.getInstallationPrice());

        BigDecimal marginAmount = pricingService.calculateMarginAmount(baseAmount, quotation.getMarginPercentage());
        BigDecimal taxAmount = pricingService.calculateTaxAmount(subtotal.add(marginAmount), quotation.getTaxPercentage());

        // Set calculated values
        quotation.setSubtotal(subtotal);
        quotation.setMarginAmount(marginAmount);
        quotation.setTaxAmount(taxAmount);
        quotation.setTotalAmount(subtotal.add(marginAmount).add(taxAmount));
    }

    // Conversion methods
    private QuotationDto convertToDto(Quotation quotation, String userRole) {
        QuotationDto dto = new QuotationDto();

        // Copy all existing fields...
        dto.setId(quotation.getId());
        dto.setCustomerId(quotation.getCustomer().getId());
        dto.setCustomerName(quotation.getCustomer().getName());
        dto.setQuotationNumber(quotation.getQuotationNumber());
        dto.setProjectName(quotation.getProjectName());
        dto.setTransportationPrice(quotation.getTransportationPrice());
        dto.setInstallationPrice(quotation.getInstallationPrice());
        dto.setTaxPercentage(quotation.getTaxPercentage());
        dto.setSubtotal(quotation.getSubtotal());
        dto.setTaxAmount(quotation.getTaxAmount());
        dto.setTotalAmount(quotation.getTotalAmount());
        dto.setStatus(quotation.getStatus());
        dto.setValidUntil(quotation.getValidUntil());
        dto.setNotes(quotation.getNotes());
        dto.setTermsConditions(quotation.getTermsConditions());
        dto.setCreatedBy(quotation.getCreatedBy());
        dto.setApprovedBy(quotation.getApprovedBy());
        dto.setApprovedAt(quotation.getApprovedAt());
        dto.setCreatedAt(quotation.getCreatedAt());
        dto.setUpdatedAt(quotation.getUpdatedAt());

        // Set category-wise totals
        dto.setAccessoriesBaseTotal(quotation.getAccessoriesBaseTotal());
        dto.setAccessoriesFinalTotal(quotation.getAccessoriesFinalTotal());
        dto.setCabinetsBaseTotal(quotation.getCabinetsBaseTotal());
        dto.setCabinetsFinalTotal(quotation.getCabinetsFinalTotal());
        dto.setDoorsBaseTotal(quotation.getDoorsBaseTotal());
        dto.setDoorsFinalTotal(quotation.getDoorsFinalTotal());
        dto.setLightingBaseTotal(quotation.getLightingBaseTotal());
        dto.setLightingFinalTotal(quotation.getLightingFinalTotal());

        // Only show margin details to SUPER_ADMIN
        if ("ROLE_SUPER_ADMIN".equals(userRole)) {
            dto.setMarginPercentage(quotation.getMarginPercentage());
            dto.setMarginAmount(quotation.getMarginAmount());

            // Category-wise margin and tax for admin
            dto.setAccessoriesMarginAmount(quotation.getAccessoriesMarginAmount());
            dto.setAccessoriesTaxAmount(quotation.getAccessoriesTaxAmount());
            dto.setCabinetsMarginAmount(quotation.getCabinetsMarginAmount());
            dto.setCabinetsTaxAmount(quotation.getCabinetsTaxAmount());
            dto.setDoorsMarginAmount(quotation.getDoorsMarginAmount());
            dto.setDoorsTaxAmount(quotation.getDoorsTaxAmount());
            dto.setLightingMarginAmount(quotation.getLightingMarginAmount());
            dto.setLightingTaxAmount(quotation.getLightingTaxAmount());
        }

        // Load line items
        dto.setAccessories(loadAccessories(quotation.getId(), userRole));
        dto.setCabinets(loadCabinets(quotation.getId(), userRole));
        dto.setDoors(loadDoors(quotation.getId(), userRole));
        dto.setLighting(loadLighting(quotation.getId(), userRole));

        return dto;
    }

    private QuotationSummaryDto convertToSummaryDto(Quotation quotation) {
        return new QuotationSummaryDto(
                quotation.getId(),
                quotation.getQuotationNumber(),
                quotation.getCustomer().getName(),
                quotation.getProjectName(),
                quotation.getTotalAmount(),
                quotation.getStatus(),
                quotation.getValidUntil(),
                quotation.getCreatedAt(),
                quotation.getCreatedBy()
        );
    }


    private List<QuotationAccessoryDto> loadAccessories(Long quotationId, String userRole) {
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotationId);
        return accessories.stream().map(quotationAccessory -> {
            QuotationAccessoryDto dto = new QuotationAccessoryDto();

            // Basic quotation accessory fields
            dto.setId(quotationAccessory.getId());
            dto.setQuantity(quotationAccessory.getQuantity());
            dto.setUnitPrice(quotationAccessory.getUnitPrice());
            dto.setTotalPrice(quotationAccessory.getTotalPrice());
            dto.setDescription(quotationAccessory.getDescription());
            dto.setCustomItem(quotationAccessory.getCustomItem());
            dto.setCustomItemName(quotationAccessory.getCustomItemName());

            // Map accessory entity data for images and details
            Accessory accessory = quotationAccessory.getAccessory();
            if (accessory != null) {
                dto.setAccessoryId(accessory.getId());
                dto.setAccessoryName(accessory.getName());
                dto.setImageUrl(accessory.getImageUrl());          // KEY: Image URL mapping
                dto.setWidthMm(accessory.getWidthMm());
                dto.setHeightMm(accessory.getHeightMm());
                dto.setDepthMm(accessory.getDepthMm());
                dto.setColor(accessory.getColor());
                dto.setMaterialCode(accessory.getMaterialCode());

                // Brand and category info
                if (accessory.getBrand() != null) {
                    dto.setBrandName(accessory.getBrand().getName());
                }
                if (accessory.getCategory() != null) {
                    dto.setCategoryName(accessory.getCategory().getName());
                }
            } else if (quotationAccessory.getCustomItem()) {
                // For custom items, use the custom name
                dto.setAccessoryName(quotationAccessory.getCustomItemName());
            }

            // Note: Your QuotationAccessory entity doesn't have marginAmount/taxAmount fields
            // These would need to be calculated if needed for admin view
            // For now, we'll leave them null unless you add these fields to the entity

            return dto;
        }).toList();
    }
    private List<QuotationCabinetDto> loadCabinets(Long quotationId, String userRole) {
        List<QuotationCabinet> cabinets = cabinetRepository.findByQuotationId(quotationId);
        return cabinets.stream().map(cabinet -> {
            QuotationCabinetDto dto = new QuotationCabinetDto();
            dto.setId(cabinet.getId());
            dto.setQuantity(cabinet.getQuantity());
            dto.setWidthMm(cabinet.getWidthMm());
            dto.setHeightMm(cabinet.getHeightMm());
            dto.setDepthMm(cabinet.getDepthMm());
            dto.setCalculatedSqft(cabinet.getCalculatedSqft());
            dto.setUnitPrice(cabinet.getUnitPrice());
            dto.setTotalPrice(cabinet.getTotalPrice());

            dto.setCustomDimensions("true".equals(cabinet.getCustomDimensions()));

            // Only show margin to super admin
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                // Calculate margin and tax for this specific item
                BigDecimal baseAmount;
                if (cabinet.getCalculatedSqft() != null) {
                    baseAmount = cabinet.getUnitPrice().multiply(cabinet.getCalculatedSqft()).multiply(BigDecimal.valueOf(cabinet.getQuantity()));
                } else {
                    baseAmount = cabinet.getUnitPrice().multiply(BigDecimal.valueOf(cabinet.getQuantity()));
                }

                BigDecimal marginAmount = pricingService.calculateMarginAmount(baseAmount, cabinet.getQuotation().getMarginPercentage());
                BigDecimal taxAmount = pricingService.calculateTaxAmount(baseAmount.add(marginAmount), cabinet.getQuotation().getTaxPercentage());

                dto.setMarginAmount(marginAmount);
                dto.setTaxAmount(taxAmount);
            }

            return dto;
        }).toList();
    }

    private List<QuotationDoorDto> loadDoors(Long quotationId, String userRole) {
        List<QuotationDoor> doors = doorRepository.findByQuotationId(quotationId);
        return doors.stream().map(door -> {
            QuotationDoorDto dto = new QuotationDoorDto();
            dto.setId(door.getId());
            dto.setQuantity(door.getQuantity());
            dto.setWidthMm(door.getWidthMm());
            dto.setHeightMm(door.getHeightMm());
            dto.setCalculatedSqft(door.getCalculatedSqft());
            dto.setUnitPrice(door.getUnitPrice());
            dto.setTotalPrice(door.getTotalPrice());
            dto.setDoorFinish(door.getDoorFinish());
            dto.setDoorStyle(door.getDoorStyle());
            dto.setDescription(door.getDescription());
            dto.setCustomDimensions("true".equals(door.getCustomDimensions()));

            // Only show margin to super admin
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                BigDecimal baseAmount;
                if (door.getCalculatedSqft() != null) {
                    baseAmount = door.getUnitPrice().multiply(door.getCalculatedSqft()).multiply(BigDecimal.valueOf(door.getQuantity()));
                } else {
                    baseAmount = door.getUnitPrice().multiply(BigDecimal.valueOf(door.getQuantity()));
                }

                BigDecimal marginAmount = pricingService.calculateMarginAmount(baseAmount, door.getQuotation().getMarginPercentage());
                BigDecimal taxAmount = pricingService.calculateTaxAmount(baseAmount.add(marginAmount), door.getQuotation().getTaxPercentage());

                dto.setMarginAmount(marginAmount);
                dto.setTaxAmount(taxAmount);
            }

            return dto;
        }).toList();
    }

    private List<QuotationLightingDto> loadLighting(Long quotationId, String userRole) {
        List<QuotationLighting> lightingList = lightingRepository.findByQuotationId(quotationId);
        return lightingList.stream().map(lighting -> {
            QuotationLightingDto dto = new QuotationLightingDto();
            dto.setId(lighting.getId());
            dto.setItemType(lighting.getItemType().name());
            dto.setItemId(lighting.getItemId());
            dto.setItemName(lighting.getItemName());
            dto.setQuantity(lighting.getQuantity());
            dto.setUnit(lighting.getUnit());
            dto.setUnitPrice(lighting.getUnitPrice());
            dto.setTotalPrice(lighting.getTotalPrice());
            dto.setSpecifications(lighting.getSpecifications());
            dto.setDescription(lighting.getDescription());
            dto.setWattage(lighting.getWattage());
            dto.setProfileType(lighting.getProfileType());
            dto.setSensorType(lighting.getSensorType());
            dto.setConnectorType(lighting.getConnectorType());

            // Only show margin to super admin
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
                dto.setMarginAmount(lighting.getQuotation().getMarginAmount());
                dto.setTaxAmount(lighting.getQuotation().getTaxAmount());
            }

            return dto;
        }).toList();
    }
}