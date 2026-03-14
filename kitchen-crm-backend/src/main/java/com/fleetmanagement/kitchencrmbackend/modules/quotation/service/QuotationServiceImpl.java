package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Accessory;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.CabinetType;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.DoorType;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.LightProfile;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Driver;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Connector;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.Sensor;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignedDocument;
import com.fleetmanagement.kitchencrmbackend.modules.signature.entity.SignatureStatus;
import com.fleetmanagement.kitchencrmbackend.modules.settings.service.SystemSettingService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private AccessoryRepository productAccessoryRepository;

    @Autowired
    private CabinetTypeRepository cabinetTypeRepository;

    @Autowired
    private DoorTypeRepository doorTypeRepository;

    @Autowired
    private LightProfileRepository lightProfileRepository;

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
    private SystemSettingService systemSettingService;

    @Autowired
    private QuotationKitchenRepository kitchenRepository;

    @Autowired
    private QuotationKitchenPlanImageRepository kitchenPlanImageRepository;

    @Autowired
    private QuotationKitchenScopeDetailRepository kitchenScopeDetailRepository;

    @Autowired
    private QuotationElevationRepository elevationRepository;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerPlanImageRepository customerPlanImageRepository;

    @Autowired
    private com.fleetmanagement.kitchencrmbackend.modules.customer.repository.DesignPhaseFileRepository designPhaseFileRepository;

    @Autowired
    private QuotationOtherExpenseRepository otherExpenseRepository;

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
            quotation.setValidUntil(LocalDate.now().plusDays(30));
            quotation.setNotes(dto.getNotes());
            quotation.setTermsConditions(dto.getTermsConditions());
            quotation.setWarrantyAndService(dto.getWarrantyAndService());

            // Set the createdBy field using the parameter
            quotation.setCreatedBy(createdBy);
            quotation.setStatus(Quotation.QuotationStatus.DRAFT);

            // Set default values
            quotation.setMarginPercentage(dto.getMarginPercentage() != null ? dto.getMarginPercentage() : BigDecimal.ZERO);
            quotation.setTaxPercentage(dto.getTaxPercentage() != null ? dto.getTaxPercentage() : BigDecimal.valueOf(18.0));
            quotation.setTransportationPrice(dto.getTransportationPrice() != null ? dto.getTransportationPrice() : BigDecimal.ZERO);
            quotation.setInstallationPrice(dto.getInstallationPrice() != null ? dto.getInstallationPrice() : BigDecimal.ZERO);
            
            // Use category-specific margins from DTO if provided (super admin can override), otherwise use global defaults
            quotation.setAccessoriesMarginPercentage(dto.getAccessoriesMarginPercentage() != null ? dto.getAccessoriesMarginPercentage() : systemSettingService.getMarginPercentage("accessories"));
            quotation.setCabinetsMarginPercentage(dto.getCabinetsMarginPercentage() != null ? dto.getCabinetsMarginPercentage() : systemSettingService.getMarginPercentage("cabinets"));
            quotation.setDoorsMarginPercentage(dto.getDoorsMarginPercentage() != null ? dto.getDoorsMarginPercentage() : systemSettingService.getMarginPercentage("doors"));
            quotation.setLightingMarginPercentage(dto.getLightingMarginPercentage() != null ? dto.getLightingMarginPercentage() : systemSettingService.getMarginPercentage("lighting"));
            
            // Use tax percentages from DTO if provided, otherwise use defaults
            quotation.setAccessoriesTaxPercentage(dto.getAccessoriesTaxPercentage() != null ? dto.getAccessoriesTaxPercentage() : BigDecimal.valueOf(18.0));
            quotation.setCabinetsTaxPercentage(dto.getCabinetsTaxPercentage() != null ? dto.getCabinetsTaxPercentage() : BigDecimal.valueOf(18.0));
            quotation.setDoorsTaxPercentage(dto.getDoorsTaxPercentage() != null ? dto.getDoorsTaxPercentage() : BigDecimal.valueOf(18.0));
            quotation.setLightingTaxPercentage(dto.getLightingTaxPercentage() != null ? dto.getLightingTaxPercentage() : BigDecimal.valueOf(18.0));

            // Miscellaneous (Other Expenses) margin & tax
            quotation.setMiscellaneousMarginPercentage(dto.getMiscellaneousMarginPercentage() != null ? dto.getMiscellaneousMarginPercentage() : BigDecimal.ZERO);
            quotation.setMiscellaneousTaxPercentage(dto.getMiscellaneousTaxPercentage() != null ? dto.getMiscellaneousTaxPercentage() : BigDecimal.valueOf(18.0));

            // Important Note & Payment Terms
            quotation.setImportantNote(dto.getImportantNote());
            quotation.setPaymentAcceptancePct(dto.getPaymentAcceptancePct() != null ? dto.getPaymentAcceptancePct() : BigDecimal.valueOf(60));
            quotation.setPaymentDeliveryPct(dto.getPaymentDeliveryPct() != null ? dto.getPaymentDeliveryPct() : BigDecimal.valueOf(30));
            quotation.setPaymentInstallationPct(dto.getPaymentInstallationPct() != null ? dto.getPaymentInstallationPct() : BigDecimal.valueOf(10));

            // Save quotation first to get ID
            Quotation savedQuotation = quotationRepository.save(quotation);

            // Save kitchens first (if any)
            if (dto.getKitchens() != null && !dto.getKitchens().isEmpty()) {
                saveKitchens(savedQuotation, dto.getKitchens());
            }

            // Save line items (with kitchen associations)
            saveLineItems(savedQuotation, dto, userRole);

            // FIXED: Use PricingService instead of local method
            // This will calculate both category totals AND overall totals
            pricingService.calculateQuotationTotals(savedQuotation);
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
        if (existingQuotation.getStatus() == Quotation.QuotationStatus.APPROVED || 
            existingQuotation.getStatus() == Quotation.QuotationStatus.REJECTED) {
            return ApiResponse.error("Cannot update approved or rejected quotations");
        }

        // Update quotation fields
        existingQuotation.setProjectName(quotationDto.getProjectName());
        existingQuotation.setTransportationPrice(quotationDto.getTransportationPrice());
        existingQuotation.setInstallationPrice(quotationDto.getInstallationPrice());
        existingQuotation.setMarginPercentage(quotationDto.getMarginPercentage());
        existingQuotation.setTaxPercentage(quotationDto.getTaxPercentage());
        existingQuotation.setValidUntil(LocalDate.now().plusDays(30));
        existingQuotation.setNotes(quotationDto.getNotes());
        existingQuotation.setTermsConditions(quotationDto.getTermsConditions());
        existingQuotation.setWarrantyAndService(quotationDto.getWarrantyAndService());

        // Update category-specific margin and tax percentages (super admin can modify these)
        existingQuotation.setAccessoriesMarginPercentage(quotationDto.getAccessoriesMarginPercentage());
        existingQuotation.setCabinetsMarginPercentage(quotationDto.getCabinetsMarginPercentage());
        existingQuotation.setDoorsMarginPercentage(quotationDto.getDoorsMarginPercentage());
        existingQuotation.setLightingMarginPercentage(quotationDto.getLightingMarginPercentage());
        existingQuotation.setAccessoriesTaxPercentage(quotationDto.getAccessoriesTaxPercentage());
        existingQuotation.setCabinetsTaxPercentage(quotationDto.getCabinetsTaxPercentage());
        existingQuotation.setDoorsTaxPercentage(quotationDto.getDoorsTaxPercentage());
        existingQuotation.setLightingTaxPercentage(quotationDto.getLightingTaxPercentage());
        existingQuotation.setMiscellaneousMarginPercentage(quotationDto.getMiscellaneousMarginPercentage());
        existingQuotation.setMiscellaneousTaxPercentage(quotationDto.getMiscellaneousTaxPercentage());

        // Important Note & Payment Terms
        existingQuotation.setImportantNote(quotationDto.getImportantNote());
        existingQuotation.setPaymentAcceptancePct(quotationDto.getPaymentAcceptancePct());
        existingQuotation.setPaymentDeliveryPct(quotationDto.getPaymentDeliveryPct());
        existingQuotation.setPaymentInstallationPct(quotationDto.getPaymentInstallationPct());

        // Delete existing kitchens and line items
        kitchenRepository.deleteByQuotationId(id);
        deleteExistingLineItems(id);

        // Save kitchens (if any)
        if (quotationDto.getKitchens() != null && !quotationDto.getKitchens().isEmpty()) {
            List<QuotationKitchenCreateDto> kitchenCreateDtos = quotationDto.getKitchens().stream().map(k -> {
                QuotationKitchenCreateDto kdto = new QuotationKitchenCreateDto();
                kdto.setKitchenName(k.getKitchenName());
                kdto.setKitchenOrder(k.getKitchenOrder());
                kdto.setTransportationPrice(k.getTransportationPrice());
                kdto.setInstallationPrice(k.getInstallationPrice());
                // Convert scope details and plan images
                if (k.getScopeDetails() != null) {
                    kdto.setScopeDetails(k.getScopeDetails().stream().map(sd -> {
                        QuotationKitchenScopeDetailCreateDto sdto = new QuotationKitchenScopeDetailCreateDto();
                        sdto.setFieldName(sd.getFieldName());
                        sdto.setFieldValue(sd.getFieldValue());
                        sdto.setFieldOrder(sd.getFieldOrder());
                        return sdto;
                    }).toList());
                }
                if (k.getPlanImages() != null) {
                    kdto.setPlanImages(k.getPlanImages().stream().map(pi -> {
                        QuotationKitchenPlanImageCreateDto pidto = new QuotationKitchenPlanImageCreateDto();
                        pidto.setCustomerPlanImageId(pi.getCustomerPlanImageId());
                        pidto.setDesignPhaseFileId(pi.getDesignPhaseFileId());
                        pidto.setImageName(pi.getImageName());
                        pidto.setImageUrl(pi.getImageUrl());
                        pidto.setImageOrder(pi.getImageOrder());
                        return pidto;
                    }).toList());
                }
                // Convert elevations
                if (k.getElevations() != null) {
                    kdto.setElevations(k.getElevations().stream().map(el -> {
                        QuotationElevationCreateDto eldto = new QuotationElevationCreateDto();
                        eldto.setName(el.getName());
                        eldto.setDisplayOrder(el.getDisplayOrder());
                        return eldto;
                    }).toList());
                }
                // Copy kitchen products
                kdto.setAccessories(k.getAccessories());
                kdto.setCabinets(k.getCabinets());
                kdto.setDoors(k.getDoors());
                kdto.setLighting(k.getLighting());
                kdto.setOtherExpenses(k.getOtherExpenses());
                return kdto;
            }).toList();
            saveKitchens(existingQuotation, kitchenCreateDtos);
        }

        QuotationCreateDto createDto = new QuotationCreateDto();
        createDto.setAccessories(quotationDto.getAccessories());
        createDto.setCabinets(quotationDto.getCabinets());
        createDto.setDoors(quotationDto.getDoors());
        createDto.setLighting(quotationDto.getLighting());
        createDto.setOtherExpenses(quotationDto.getOtherExpenses());

        saveLineItems(existingQuotation, createDto, userRole);

        // FIXED: Use PricingService instead of local method
        // This will calculate both category totals AND overall totals
        pricingService.calculateQuotationTotals(existingQuotation);
        Quotation updatedQuotation = quotationRepository.save(existingQuotation);

        return ApiResponse.success("Quotation updated successfully", convertToDto(updatedQuotation, userRole));
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
        newQuotation.setWarrantyAndService(originalQuotation.getWarrantyAndService());
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

    // FIXED: Item details population methods
    private void populateAccessoryItemDetails(QuotationAccessory quotationAccessory, Long accessoryId) {
        if (accessoryId != null) {
            Accessory accessory = productAccessoryRepository.findById(accessoryId).orElse(null);
            if (accessory != null) {
                quotationAccessory.setAccessory(accessory);
            }
        }
    }

    private void populateCabinetItemDetails(QuotationCabinet quotationCabinet, Long cabinetTypeId) {
        if (cabinetTypeId != null) {
            CabinetType cabinetType = cabinetTypeRepository.findById(cabinetTypeId).orElse(null);
            if (cabinetType != null) {
                quotationCabinet.setCabinetType(cabinetType);
            }
        }
    }

    private void populateDoorItemDetails(QuotationDoor quotationDoor, Long doorTypeId) {
        if (doorTypeId != null) {
            DoorType doorType = doorTypeRepository.findById(doorTypeId).orElse(null);
            if (doorType != null) {
                quotationDoor.setDoorType(doorType);
            }
        }
    }

    private void populateLightingItemDetails(QuotationLighting quotationLighting, String itemType, Long itemId) {
        if ("LIGHT_PROFILE".equals(itemType) && itemId != null) {
            LightProfile lightProfile = lightProfileRepository.findById(itemId).orElse(null);
            if (lightProfile != null) {
                quotationLighting.setItemName("Light Profile - Type " + lightProfile.getProfileType());
                quotationLighting.setProfileType(lightProfile.getProfileType().toString());

                // Set appropriate unit if not already set
                if (quotationLighting.getUnit() == null) {
                    quotationLighting.setUnit("Meter");
                }
            }
        } else if ("DRIVER".equals(itemType) && itemId != null) {
            Driver driver = driverRepository.findById(itemId).orElse(null);
            if (driver != null) {
                quotationLighting.setItemName("Driver - " + driver.getWattage() + "W");
                quotationLighting.setWattage(driver.getWattage());

                // Set appropriate unit if not already set
                if (quotationLighting.getUnit() == null) {
                    quotationLighting.setUnit("Pieces");
                }
            }
        } else if ("CONNECTOR".equals(itemType) && itemId != null) {
            Connector connector = connectorRepository.findById(itemId).orElse(null);
            if (connector != null) {
                quotationLighting.setItemName("Connector - " + connector.getType().toString().replace("_", " "));
                quotationLighting.setConnectorType(connector.getType().toString());

                // Set appropriate unit if not already set
                if (quotationLighting.getUnit() == null) {
                    quotationLighting.setUnit("Pieces");
                }
            }
        } else if ("SENSOR".equals(itemType) && itemId != null) {
            Sensor sensor = sensorRepository.findById(itemId).orElse(null);
            if (sensor != null) {
                quotationLighting.setItemName("Sensor - " + sensor.getType().toString().replace("_", " "));
                quotationLighting.setSensorType(sensor.getType().toString());

                // Set appropriate unit if not already set
                if (quotationLighting.getUnit() == null) {
                    quotationLighting.setUnit("Pieces");
                }
            }
        }
    }

    private void saveLineItems(Quotation quotation, QuotationCreateDto dto, String userRole) {
        // Save accessories with proper item details
        if (dto.getAccessories() != null) {
            for (QuotationAccessoryDto accessoryDto : dto.getAccessories()) {
                QuotationAccessory accessory = new QuotationAccessory();
                accessory.setQuotation(quotation);
                accessory.setQuantity(accessoryDto.getQuantity());
                accessory.setUnitPrice(accessoryDto.getUnitPrice());
                accessory.setDescription(accessoryDto.getDescription());
                accessory.setCustomItem(accessoryDto.getCustomItem());
                accessory.setCustomItemName(accessoryDto.getCustomItemName());

                // Set kitchen association if provided
                if (accessoryDto.getKitchenId() != null) {
                    kitchenRepository.findById(accessoryDto.getKitchenId()).ifPresent(accessory::setKitchen);
                }

                // Set elevation fields
                accessory.setElevationId(accessoryDto.getElevationId());
                accessory.setElevationName(accessoryDto.getElevationName());

                // IMPORTANT: Populate item details for proper name display
                if (accessoryDto.getAccessoryId() != null) {
                    populateAccessoryItemDetails(accessory, accessoryDto.getAccessoryId());
                }

                pricingService.calculateAccessoryLineTotal(accessory, quotation.getAccessoriesMarginPercentage(), quotation.getAccessoriesTaxPercentage());
                accessoryRepository.save(accessory);
            }
        }

        // Save cabinets with proper item details
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

                // Set material, lighting, and accessories fields
                cabinet.setMaterialId(cabinetDto.getMaterialId());
                cabinet.setMaterialRate(cabinetDto.getMaterialRate());
                cabinet.setLightingCost(cabinetDto.getLightingCost());
                cabinet.setAccessoriesCost(cabinetDto.getAccessoriesCost());

                // Set elevation fields
                cabinet.setElevationId(cabinetDto.getElevationId());
                cabinet.setElevationName(cabinetDto.getElevationName());

                // Set kitchen association if provided
                if (cabinetDto.getKitchenId() != null) {
                    kitchenRepository.findById(cabinetDto.getKitchenId()).ifPresent(cabinet::setKitchen);
                }

                // IMPORTANT: Populate cabinet type details for proper name display
                if (cabinetDto.getCabinetTypeId() != null) {
                    populateCabinetItemDetails(cabinet, cabinetDto.getCabinetTypeId());
                }

                // Set linked door type if provided
                if (cabinetDto.getLinkedDoorTypeId() != null) {
                    doorTypeRepository.findById(cabinetDto.getLinkedDoorTypeId())
                            .ifPresent(cabinet::setLinkedDoorType);
                }

                pricingService.calculateCabinetLineTotal(cabinet, quotation.getCabinetsMarginPercentage(), quotation.getCabinetsTaxPercentage());
                cabinetRepository.save(cabinet);
            }
        }

        // Save doors with proper item details
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
                door.setCustomDimensions(doorDto.getCustomDimensions() != null ? doorDto.getCustomDimensions().toString() : null);

                // Set elevation fields
                door.setElevationId(doorDto.getElevationId());
                door.setElevationName(doorDto.getElevationName());

                // Set kitchen association if provided
                if (doorDto.getKitchenId() != null) {
                    kitchenRepository.findById(doorDto.getKitchenId()).ifPresent(door::setKitchen);
                }

                // IMPORTANT: Populate door type details
                if (doorDto.getDoorTypeId() != null) {
                    populateDoorItemDetails(door, doorDto.getDoorTypeId());
                }

                pricingService.calculateDoorLineTotal(door, quotation.getDoorsMarginPercentage(), quotation.getDoorsTaxPercentage());
                doorRepository.save(door);
            }
        }

        // FIXED: Save lighting with proper item details AND unit field
        if (dto.getLighting() != null) {
            for (QuotationLightingDto lightingDto : dto.getLighting()) {
                QuotationLighting lighting = new QuotationLighting();
                lighting.setQuotation(quotation);
                lighting.setItemType(QuotationLighting.LightingItemType.valueOf(lightingDto.getItemType()));
                lighting.setItemId(lightingDto.getItemId());
                lighting.setQuantity(lightingDto.getQuantity());
                lighting.setUnitPrice(lightingDto.getUnitPrice());

                // CRITICAL FIX: Set the unit field based on item type
                lighting.setUnit(determineUnit(lightingDto.getItemType()));

                // Set kitchen association if provided
                if (lightingDto.getKitchenId() != null) {
                    kitchenRepository.findById(lightingDto.getKitchenId()).ifPresent(lighting::setKitchen);
                }

                // IMPORTANT: Populate lighting item details for proper name display
                populateLightingItemDetails(lighting, lightingDto.getItemType(), lightingDto.getItemId());

                pricingService.calculateLightingLineTotal(lighting, quotation.getLightingMarginPercentage(), quotation.getLightingTaxPercentage());
                lightingRepository.save(lighting);
            }
        }

        // Save other expenses
        if (dto.getOtherExpenses() != null) {
            for (QuotationOtherExpenseDto expenseDto : dto.getOtherExpenses()) {
                QuotationOtherExpense expense = new QuotationOtherExpense();
                expense.setQuotation(quotation);
                expense.setName(expenseDto.getName());
                expense.setAmount(expenseDto.getAmount() != null ? expenseDto.getAmount() : BigDecimal.ZERO);
                expense.setIsDefault(expenseDto.getIsDefault() != null ? expenseDto.getIsDefault() : false);
                otherExpenseRepository.save(expense);
            }
        }
    }

    // NEW: Helper method to determine unit based on lighting item type
    private String determineUnit(String itemType) {
        switch (itemType) {
            case "LIGHT_PROFILE":
                return "Meter"; // Light profiles are typically sold per meter
            case "DRIVER":
                return "Pieces"; // Drivers are sold as individual pieces
            case "CONNECTOR":
                return "Pieces"; // Connectors are sold as individual pieces
            case "SENSOR":
                return "Pieces"; // Sensors are sold as individual pieces
            default:
                return "Pieces"; // Default fallback
        }
    }

    private void saveKitchens(Quotation quotation, List<QuotationKitchenCreateDto> kitchenDtos) {
        for (QuotationKitchenCreateDto kitchenDto : kitchenDtos) {
            QuotationKitchen kitchen = new QuotationKitchen();
            kitchen.setQuotation(quotation);
            kitchen.setKitchenName(kitchenDto.getKitchenName());
            kitchen.setKitchenOrder(kitchenDto.getKitchenOrder() != null ? kitchenDto.getKitchenOrder() : 0);
            kitchen.setTransportationPrice(kitchenDto.getTransportationPrice() != null ? kitchenDto.getTransportationPrice() : BigDecimal.ZERO);
            kitchen.setInstallationPrice(kitchenDto.getInstallationPrice() != null ? kitchenDto.getInstallationPrice() : BigDecimal.ZERO);
            
            QuotationKitchen savedKitchen = kitchenRepository.save(kitchen);
            
            // Save scope details
            if (kitchenDto.getScopeDetails() != null) {
                for (QuotationKitchenScopeDetailCreateDto scopeDto : kitchenDto.getScopeDetails()) {
                    QuotationKitchenScopeDetail scopeDetail = new QuotationKitchenScopeDetail();
                    scopeDetail.setKitchen(savedKitchen);
                    scopeDetail.setFieldName(scopeDto.getFieldName());
                    scopeDetail.setFieldValue(scopeDto.getFieldValue());
                    scopeDetail.setFieldOrder(scopeDto.getFieldOrder() != null ? scopeDto.getFieldOrder() : 0);
                    kitchenScopeDetailRepository.save(scopeDetail);
                }
            }
            
            // Save plan images
            if (kitchenDto.getPlanImages() != null) {
                for (QuotationKitchenPlanImageCreateDto planImageDto : kitchenDto.getPlanImages()) {
                    QuotationKitchenPlanImage planImage = new QuotationKitchenPlanImage();
                    planImage.setKitchen(savedKitchen);
                    planImage.setImageName(planImageDto.getImageName());
                    planImage.setImageUrl(planImageDto.getImageUrl());
                    planImage.setImageOrder(planImageDto.getImageOrder() != null ? planImageDto.getImageOrder() : 0);

                    // Set reference to customer plan image or design phase file
                    if (planImageDto.getCustomerPlanImageId() != null) {
                        customerPlanImageRepository.findById(planImageDto.getCustomerPlanImageId()).ifPresent(planImage::setCustomerPlanImage);
                    }
                    if (planImageDto.getDesignPhaseFileId() != null) {
                        designPhaseFileRepository.findById(planImageDto.getDesignPhaseFileId()).ifPresent(planImage::setDesignPhaseFile);
                    }

                    kitchenPlanImageRepository.save(planImage);
                }
            }

            // Save elevations
            if (kitchenDto.getElevations() != null) {
                for (QuotationElevationCreateDto elevationDto : kitchenDto.getElevations()) {
                    QuotationElevation elevation = new QuotationElevation();
                    elevation.setKitchen(savedKitchen);
                    elevation.setName(elevationDto.getName());
                    elevation.setDisplayOrder(elevationDto.getDisplayOrder() != null ? elevationDto.getDisplayOrder() : 0);
                    elevationRepository.save(elevation);
                }
            }

            // Save products for this kitchen
            saveKitchenProducts(savedKitchen, quotation, kitchenDto);
        }
    }
    
    private void saveKitchenProducts(QuotationKitchen kitchen, Quotation quotation, QuotationKitchenCreateDto kitchenDto) {
        // Save accessories for this kitchen
        if (kitchenDto.getAccessories() != null) {
            for (QuotationAccessoryDto accessoryDto : kitchenDto.getAccessories()) {
                QuotationAccessory accessory = new QuotationAccessory();
                accessory.setQuotation(quotation);
                accessory.setKitchen(kitchen); // CRITICAL: Associate with kitchen
                accessory.setQuantity(accessoryDto.getQuantity());
                accessory.setUnitPrice(accessoryDto.getUnitPrice());
                accessory.setDescription(accessoryDto.getDescription());
                accessory.setCustomItem(accessoryDto.getCustomItem());
                accessory.setCustomItemName(accessoryDto.getCustomItemName());

                // Set elevation fields
                accessory.setElevationId(accessoryDto.getElevationId());
                accessory.setElevationName(accessoryDto.getElevationName());

                // Populate item details for proper name display
                if (accessoryDto.getAccessoryId() != null) {
                    populateAccessoryItemDetails(accessory, accessoryDto.getAccessoryId());
                }

                pricingService.calculateAccessoryLineTotal(accessory, quotation.getAccessoriesMarginPercentage(), quotation.getAccessoriesTaxPercentage());
                accessoryRepository.save(accessory);
            }
        }

        // Save cabinets for this kitchen
        if (kitchenDto.getCabinets() != null) {
            for (QuotationCabinetDto cabinetDto : kitchenDto.getCabinets()) {
                QuotationCabinet cabinet = new QuotationCabinet();
                cabinet.setQuotation(quotation);
                cabinet.setKitchen(kitchen); // CRITICAL: Associate with kitchen
                cabinet.setQuantity(cabinetDto.getQuantity());
                cabinet.setWidthMm(cabinetDto.getWidthMm());
                cabinet.setHeightMm(cabinetDto.getHeightMm());
                cabinet.setDepthMm(cabinetDto.getDepthMm());
                cabinet.setUnitPrice(cabinetDto.getUnitPrice());
                cabinet.setCustomDimensions(cabinetDto.getCustomDimensions() != null && cabinetDto.getCustomDimensions()
                        ? "true" : "false");

                // Set material, lighting, and accessories fields
                cabinet.setMaterialId(cabinetDto.getMaterialId());
                cabinet.setMaterialRate(cabinetDto.getMaterialRate());
                cabinet.setLightingCost(cabinetDto.getLightingCost());
                cabinet.setAccessoriesCost(cabinetDto.getAccessoriesCost());

                // Set elevation fields
                cabinet.setElevationId(cabinetDto.getElevationId());
                cabinet.setElevationName(cabinetDto.getElevationName());

                // Populate cabinet type details for proper name display
                if (cabinetDto.getCabinetTypeId() != null) {
                    populateCabinetItemDetails(cabinet, cabinetDto.getCabinetTypeId());
                }

                // Set linked door type if provided
                if (cabinetDto.getLinkedDoorTypeId() != null) {
                    doorTypeRepository.findById(cabinetDto.getLinkedDoorTypeId())
                            .ifPresent(cabinet::setLinkedDoorType);
                }

                pricingService.calculateCabinetLineTotal(cabinet, quotation.getCabinetsMarginPercentage(), quotation.getCabinetsTaxPercentage());
                cabinetRepository.save(cabinet);
            }
        }

        // Save doors for this kitchen
        if (kitchenDto.getDoors() != null) {
            for (QuotationDoorDto doorDto : kitchenDto.getDoors()) {
                QuotationDoor door = new QuotationDoor();
                door.setQuotation(quotation);
                door.setKitchen(kitchen); // CRITICAL: Associate with kitchen
                door.setQuantity(doorDto.getQuantity());
                door.setWidthMm(doorDto.getWidthMm());
                door.setHeightMm(doorDto.getHeightMm());
                door.setUnitPrice(doorDto.getUnitPrice());
                door.setDoorFinish(doorDto.getDoorFinish());
                door.setDoorStyle(doorDto.getDoorStyle());
                door.setDescription(doorDto.getDescription());
                door.setCustomDimensions(doorDto.getCustomDimensions() != null ? doorDto.getCustomDimensions().toString() : null);

                // Set elevation fields
                door.setElevationId(doorDto.getElevationId());
                door.setElevationName(doorDto.getElevationName());

                // Populate door type details
                if (doorDto.getDoorTypeId() != null) {
                    populateDoorItemDetails(door, doorDto.getDoorTypeId());
                }

                pricingService.calculateDoorLineTotal(door, quotation.getDoorsMarginPercentage(), quotation.getDoorsTaxPercentage());
                doorRepository.save(door);
            }
        }

        // Save lighting for this kitchen
        if (kitchenDto.getLighting() != null) {
            for (QuotationLightingDto lightingDto : kitchenDto.getLighting()) {
                QuotationLighting lighting = new QuotationLighting();
                lighting.setQuotation(quotation);
                lighting.setKitchen(kitchen); // CRITICAL: Associate with kitchen
                lighting.setItemType(QuotationLighting.LightingItemType.valueOf(lightingDto.getItemType()));
                lighting.setItemId(lightingDto.getItemId());
                lighting.setQuantity(lightingDto.getQuantity());
                lighting.setUnitPrice(lightingDto.getUnitPrice());

                // Set the unit field based on item type
                lighting.setUnit(determineUnit(lightingDto.getItemType()));

                // Populate lighting item details for proper name display
                populateLightingItemDetails(lighting, lightingDto.getItemType(), lightingDto.getItemId());

                pricingService.calculateLightingLineTotal(lighting, quotation.getLightingMarginPercentage(), quotation.getLightingTaxPercentage());
                lightingRepository.save(lighting);
            }
        }

        // Save other expenses for this kitchen
        if (kitchenDto.getOtherExpenses() != null) {
            for (QuotationOtherExpenseDto expenseDto : kitchenDto.getOtherExpenses()) {
                QuotationOtherExpense expense = new QuotationOtherExpense();
                expense.setQuotation(quotation);
                expense.setKitchen(kitchen);
                expense.setName(expenseDto.getName());
                expense.setAmount(expenseDto.getAmount() != null ? expenseDto.getAmount() : BigDecimal.ZERO);
                expense.setIsDefault(expenseDto.getIsDefault() != null ? expenseDto.getIsDefault() : false);
                otherExpenseRepository.save(expense);
            }
        }
    }

    private void deleteExistingLineItems(Long quotationId) {
        accessoryRepository.deleteByQuotationId(quotationId);
        cabinetRepository.deleteByQuotationId(quotationId);
        doorRepository.deleteByQuotationId(quotationId);
        lightingRepository.deleteByQuotationId(quotationId);
        otherExpenseRepository.deleteByQuotationId(quotationId);
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
            // Copy material, lighting, and accessories fields
            copy.setMaterialId(original.getMaterialId());
            copy.setMaterialRate(original.getMaterialRate());
            copy.setLightingCost(original.getLightingCost());
            copy.setAccessoriesCost(original.getAccessoriesCost());
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

//    private void calculateQuotationTotals(Quotation quotation) {
//        BigDecimal subtotal = BigDecimal.ZERO;
//
//        // Calculate line items total
//        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotation.getId());
//        subtotal = subtotal.add(accessories.stream()
//                .map(QuotationAccessory::getTotalPrice)
//                .reduce(BigDecimal.ZERO, BigDecimal::add));
//
//        List<QuotationCabinet> cabinets = cabinetRepository.findByQuotationId(quotation.getId());
//        subtotal = subtotal.add(cabinets.stream()
//                .map(QuotationCabinet::getTotalPrice)
//                .reduce(BigDecimal.ZERO, BigDecimal::add));
//
//        List<QuotationDoor> doors = doorRepository.findByQuotationId(quotation.getId());
//        subtotal = subtotal.add(doors.stream()
//                .map(QuotationDoor::getTotalPrice)
//                .reduce(BigDecimal.ZERO, BigDecimal::add));
//
//        List<QuotationLighting> lighting = lightingRepository.findByQuotationId(quotation.getId());
//        subtotal = subtotal.add(lighting.stream()
//                .map(QuotationLighting::getTotalPrice)
//                .reduce(BigDecimal.ZERO, BigDecimal::add));
//
//        // Add transportation and installation
//        subtotal = subtotal.add(quotation.getTransportationPrice())
//                .add(quotation.getInstallationPrice());
//
//        // Calculate margin and tax on base amount (before margin)
//        BigDecimal baseAmount = subtotal.subtract(quotation.getTransportationPrice())
//                .subtract(quotation.getInstallationPrice());
//
//        BigDecimal marginAmount = pricingService.calculateMarginAmount(baseAmount, quotation.getMarginPercentage());
//        BigDecimal taxAmount = pricingService.calculateTaxAmount(subtotal.add(marginAmount), quotation.getTaxPercentage());
//
//        // Set calculated values
//        quotation.setSubtotal(subtotal);
//        quotation.setMarginAmount(marginAmount);
//        quotation.setTaxAmount(taxAmount);
//        quotation.setTotalAmount(subtotal.add(marginAmount).add(taxAmount));
//    }

    // Conversion methods
    private QuotationDto convertToDto(Quotation quotation, String userRole) {
        QuotationDto dto = new QuotationDto();

        dto.setId(quotation.getId());
        dto.setCustomerId(quotation.getCustomer().getId());
        dto.setCustomerName(quotation.getCustomer().getName());
        dto.setCustomerAddress(quotation.getCustomer().getAddress());
        dto.setQuotationNumber(quotation.getQuotationNumber());
        dto.setProjectName(quotation.getProjectName());
        dto.setTransportationPrice(quotation.getTransportationPrice());
        dto.setInstallationPrice(quotation.getInstallationPrice());
        dto.setTaxPercentage(quotation.getTaxPercentage());
        
        // Set category-specific margin and tax percentages (needed for editing)
        dto.setAccessoriesMarginPercentage(quotation.getAccessoriesMarginPercentage());
        dto.setCabinetsMarginPercentage(quotation.getCabinetsMarginPercentage());
        dto.setDoorsMarginPercentage(quotation.getDoorsMarginPercentage());
        dto.setLightingMarginPercentage(quotation.getLightingMarginPercentage());
        dto.setAccessoriesTaxPercentage(quotation.getAccessoriesTaxPercentage());
        dto.setCabinetsTaxPercentage(quotation.getCabinetsTaxPercentage());
        dto.setDoorsTaxPercentage(quotation.getDoorsTaxPercentage());
        dto.setLightingTaxPercentage(quotation.getLightingTaxPercentage());
        dto.setMiscellaneousMarginPercentage(quotation.getMiscellaneousMarginPercentage());
        dto.setMiscellaneousTaxPercentage(quotation.getMiscellaneousTaxPercentage());

        dto.setSubtotal(quotation.getSubtotal());
        dto.setTaxAmount(quotation.getTaxAmount());
        dto.setTotalAmount(quotation.getTotalAmount());
        dto.setStatus(quotation.getStatus());
        dto.setValidUntil(quotation.getValidUntil());
        dto.setNotes(quotation.getNotes());
        dto.setTermsConditions(quotation.getTermsConditions());
        dto.setWarrantyAndService(quotation.getWarrantyAndService());
        dto.setCreatedBy(quotation.getCreatedBy());
        dto.setApprovedBy(quotation.getApprovedBy());
        dto.setApprovedAt(quotation.getApprovedAt());
        dto.setCreatedAt(quotation.getCreatedAt());
        dto.setUpdatedAt(quotation.getUpdatedAt());

        // Set signature integration fields
        if (quotation.getSignedDocument() != null) {
            dto.setSignedDocumentId(quotation.getSignedDocument().getId());
            dto.setSignatureStatus(quotation.getSignedDocument().getStatus().name());
            
            // Populate signer information from SignedDocument (if signed)
            if (quotation.getSignedDocument().getStatus() == SignatureStatus.SIGNED) {
                dto.setSignerName(quotation.getSignedDocument().getCustomerName());
                dto.setSignerEmail(quotation.getSignedDocument().getCustomerEmail());
                dto.setSignerPhone(quotation.getSignedDocument().getCustomerPhone());
            }
        }
        dto.setQuotationSignedAt(quotation.getQuotationSignedAt());

        // Important Note & Payment Terms
        dto.setImportantNote(quotation.getImportantNote());
        dto.setPaymentAcceptancePct(quotation.getPaymentAcceptancePct());
        dto.setPaymentDeliveryPct(quotation.getPaymentDeliveryPct());
        dto.setPaymentInstallationPct(quotation.getPaymentInstallationPct());

        // Set category-wise totals if they exist
        if (quotation.getAccessoriesBaseTotal() != null) {
            dto.setAccessoriesBaseTotal(quotation.getAccessoriesBaseTotal());
            dto.setAccessoriesFinalTotal(quotation.getAccessoriesFinalTotal());
        }
        if (quotation.getCabinetsBaseTotal() != null) {
            dto.setCabinetsBaseTotal(quotation.getCabinetsBaseTotal());
            dto.setCabinetsFinalTotal(quotation.getCabinetsFinalTotal());
        }
        if (quotation.getDoorsBaseTotal() != null) {
            dto.setDoorsBaseTotal(quotation.getDoorsBaseTotal());
            dto.setDoorsFinalTotal(quotation.getDoorsFinalTotal());
        }
        if (quotation.getLightingBaseTotal() != null) {
            dto.setLightingBaseTotal(quotation.getLightingBaseTotal());
            dto.setLightingFinalTotal(quotation.getLightingFinalTotal());
        }

        // Only show margin details to SUPER_ADMIN
        if ("ROLE_SUPER_ADMIN".equals(userRole)) {
            dto.setMarginPercentage(quotation.getMarginPercentage());
            dto.setMarginAmount(quotation.getMarginAmount());

            // Category-wise margin and tax for admin if they exist
            if (quotation.getAccessoriesMarginAmount() != null) {
                dto.setAccessoriesMarginAmount(quotation.getAccessoriesMarginAmount());
                dto.setAccessoriesTaxAmount(quotation.getAccessoriesTaxAmount());
            }
            if (quotation.getCabinetsMarginAmount() != null) {
                dto.setCabinetsMarginAmount(quotation.getCabinetsMarginAmount());
                dto.setCabinetsTaxAmount(quotation.getCabinetsTaxAmount());
            }
            if (quotation.getDoorsMarginAmount() != null) {
                dto.setDoorsMarginAmount(quotation.getDoorsMarginAmount());
                dto.setDoorsTaxAmount(quotation.getDoorsTaxAmount());
            }
            if (quotation.getLightingMarginAmount() != null) {
                dto.setLightingMarginAmount(quotation.getLightingMarginAmount());
                dto.setLightingTaxAmount(quotation.getLightingTaxAmount());
            }
        }

        // Load line items
        dto.setAccessories(loadAccessories(quotation.getId(), userRole));
        dto.setCabinets(loadCabinets(quotation.getId(), userRole));
        dto.setDoors(loadDoors(quotation.getId(), userRole));
        dto.setLighting(loadLighting(quotation.getId(), userRole));
        dto.setOtherExpenses(loadOtherExpenses(quotation.getId()));

        // Load kitchens
        dto.setKitchens(loadKitchens(quotation.getId()));

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
                quotation.getUpdatedAt() != null ? quotation.getUpdatedAt() : quotation.getCreatedAt(),
                quotation.getCreatedBy()
        );
    }

    private List<QuotationAccessoryDto> loadAccessories(Long quotationId, String userRole) {
        List<QuotationAccessory> accessories = accessoryRepository.findByQuotationId(quotationId);
        return accessories.stream().map(quotationAccessory -> {
            QuotationAccessoryDto dto = new QuotationAccessoryDto();
            dto.setId(quotationAccessory.getId());
            dto.setQuantity(quotationAccessory.getQuantity());
            dto.setUnitPrice(quotationAccessory.getUnitPrice());
            dto.setTotalPrice(quotationAccessory.getTotalPrice());
            dto.setDescription(quotationAccessory.getDescription());
            dto.setCustomItem(quotationAccessory.getCustomItem());
            dto.setCustomItemName(quotationAccessory.getCustomItemName());

            // CRITICAL: Map accessory entity data for proper name display
            Accessory accessory = quotationAccessory.getAccessory();
            if (accessory != null) {
                dto.setAccessoryId(accessory.getId());
                dto.setAccessoryName(accessory.getName()); // THIS IS KEY FOR PDF NAME DISPLAY
                dto.setImageUrl(accessory.getImageUrl());
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
            } else if (quotationAccessory.getCustomItem() != null && quotationAccessory.getCustomItem()) {
                // For custom items, use the custom name
                dto.setAccessoryName(quotationAccessory.getCustomItemName());
            }

            // Set kitchen ID if associated
            if (quotationAccessory.getKitchen() != null) {
                dto.setKitchenId(quotationAccessory.getKitchen().getId());
            }

            // Set elevation fields
            dto.setElevationId(quotationAccessory.getElevationId());
            dto.setElevationName(quotationAccessory.getElevationName());

            return dto;
        }).toList();
    }

    private List<QuotationKitchenDto> loadKitchens(Long quotationId) {
        List<QuotationKitchen> kitchens = kitchenRepository.findByQuotationIdOrderByKitchenOrderAsc(quotationId);
        return kitchens.stream().map(kitchen -> {
            QuotationKitchenDto dto = new QuotationKitchenDto();
            dto.setId(kitchen.getId());
            dto.setQuotationId(kitchen.getQuotation().getId());
            dto.setKitchenName(kitchen.getKitchenName());
            dto.setKitchenOrder(kitchen.getKitchenOrder());
            dto.setTransportationPrice(kitchen.getTransportationPrice());
            dto.setInstallationPrice(kitchen.getInstallationPrice());
            
            // Category totals
            dto.setAccessoriesBaseTotal(kitchen.getAccessoriesBaseTotal());
            dto.setAccessoriesMarginAmount(kitchen.getAccessoriesMarginAmount());
            dto.setAccessoriesTaxAmount(kitchen.getAccessoriesTaxAmount());
            dto.setAccessoriesFinalTotal(kitchen.getAccessoriesFinalTotal());
            
            dto.setCabinetsBaseTotal(kitchen.getCabinetsBaseTotal());
            dto.setCabinetsMarginAmount(kitchen.getCabinetsMarginAmount());
            dto.setCabinetsTaxAmount(kitchen.getCabinetsTaxAmount());
            dto.setCabinetsFinalTotal(kitchen.getCabinetsFinalTotal());
            
            dto.setDoorsBaseTotal(kitchen.getDoorsBaseTotal());
            dto.setDoorsMarginAmount(kitchen.getDoorsMarginAmount());
            dto.setDoorsTaxAmount(kitchen.getDoorsTaxAmount());
            dto.setDoorsFinalTotal(kitchen.getDoorsFinalTotal());
            
            dto.setLightingBaseTotal(kitchen.getLightingBaseTotal());
            dto.setLightingMarginAmount(kitchen.getLightingMarginAmount());
            dto.setLightingTaxAmount(kitchen.getLightingTaxAmount());
            dto.setLightingFinalTotal(kitchen.getLightingFinalTotal());
            
            // Kitchen totals
            dto.setSubtotal(kitchen.getSubtotal());
            dto.setMarginAmount(kitchen.getMarginAmount());
            dto.setTaxAmount(kitchen.getTaxAmount());
            dto.setTotalAmount(kitchen.getTotalAmount());
            
            // Load scope details
            List<QuotationKitchenScopeDetail> scopeDetails = kitchenScopeDetailRepository.findByKitchenIdOrderByFieldOrderAsc(kitchen.getId());
            dto.setScopeDetails(scopeDetails.stream().map(sd -> {
                QuotationKitchenScopeDetailDto sddto = new QuotationKitchenScopeDetailDto();
                sddto.setId(sd.getId());
                sddto.setKitchenId(sd.getKitchen().getId());
                sddto.setFieldName(sd.getFieldName());
                sddto.setFieldValue(sd.getFieldValue());
                sddto.setFieldOrder(sd.getFieldOrder());
                return sddto;
            }).toList());
            
            // Load elevations
            List<QuotationElevation> elevations = elevationRepository.findByKitchenIdOrderByDisplayOrderAsc(kitchen.getId());
            dto.setElevations(elevations.stream().map(el -> {
                QuotationElevationDto eldto = new QuotationElevationDto();
                eldto.setId(el.getId());
                eldto.setName(el.getName());
                eldto.setDisplayOrder(el.getDisplayOrder());
                eldto.setKitchenId(el.getKitchen().getId());
                return eldto;
            }).toList());

            // Load plan images
            List<QuotationKitchenPlanImage> planImages = kitchenPlanImageRepository.findByKitchenIdOrderByImageOrderAsc(kitchen.getId());
            dto.setPlanImages(planImages.stream().map(pi -> {
                QuotationKitchenPlanImageDto pidto = new QuotationKitchenPlanImageDto();
                pidto.setId(pi.getId());
                pidto.setKitchenId(pi.getKitchen().getId());
                if (pi.getCustomerPlanImage() != null) {
                    pidto.setCustomerPlanImageId(pi.getCustomerPlanImage().getId());
                }
                if (pi.getDesignPhaseFile() != null) {
                    pidto.setDesignPhaseFileId(pi.getDesignPhaseFile().getId());
                }
                
                // Use URL from referenced entity if available (ensures correct path)
                String imageUrl = pi.getImageUrl();
                if (pi.getCustomerPlanImage() != null && pi.getCustomerPlanImage().getImageUrl() != null) {
                    imageUrl = pi.getCustomerPlanImage().getImageUrl();
                } else if (pi.getDesignPhaseFile() != null && pi.getDesignPhaseFile().getFileUrl() != null) {
                    // Use URL from DesignPhaseFile (ensures correct /uploads/design-files/ path)
                    imageUrl = pi.getDesignPhaseFile().getFileUrl();
                }
                
                pidto.setImageName(pi.getImageName());
                pidto.setImageUrl(imageUrl);
                pidto.setImageOrder(pi.getImageOrder());
                return pidto;
            }).toList());
            
            // Load products for this kitchen
            Long kitchenQuotationId = kitchen.getQuotation().getId();
            System.out.println("Loading products for kitchen ID: " + kitchen.getId() + " (Quotation ID: " + kitchenQuotationId + ")");
            
            // Check if products exist for the quotation but don't have kitchenId
            List<QuotationAccessory> allAccessories = accessoryRepository.findByQuotationId(kitchenQuotationId);
            List<QuotationCabinet> allCabinets = cabinetRepository.findByQuotationId(kitchenQuotationId);
            List<QuotationDoor> allDoors = doorRepository.findByQuotationId(kitchenQuotationId);
            List<QuotationLighting> allLighting = lightingRepository.findByQuotationId(kitchenQuotationId);
            
            System.out.println("Total accessories for quotation " + kitchenQuotationId + ": " + (allAccessories != null ? allAccessories.size() : 0));
            System.out.println("Total cabinets for quotation " + kitchenQuotationId + ": " + (allCabinets != null ? allCabinets.size() : 0));
            System.out.println("Total doors for quotation " + kitchenQuotationId + ": " + (allDoors != null ? allDoors.size() : 0));
            System.out.println("Total lighting for quotation " + kitchenQuotationId + ": " + (allLighting != null ? allLighting.size() : 0));
            
            // Count products with kitchenId set
            long accessoriesWithKitchen = allAccessories != null ? allAccessories.stream().filter(a -> a.getKitchen() != null).count() : 0;
            long cabinetsWithKitchen = allCabinets != null ? allCabinets.stream().filter(c -> c.getKitchen() != null).count() : 0;
            long doorsWithKitchen = allDoors != null ? allDoors.stream().filter(d -> d.getKitchen() != null).count() : 0;
            long lightingWithKitchen = allLighting != null ? allLighting.stream().filter(l -> l.getKitchen() != null).count() : 0;
            
            System.out.println("Accessories with kitchenId set: " + accessoriesWithKitchen);
            System.out.println("Cabinets with kitchenId set: " + cabinetsWithKitchen);
            System.out.println("Doors with kitchenId set: " + doorsWithKitchen);
            System.out.println("Lighting with kitchenId set: " + lightingWithKitchen);
            
            List<QuotationAccessoryDto> accessories = loadAccessoriesForKitchen(kitchen.getId());
            List<QuotationCabinetDto> cabinets = loadCabinetsForKitchen(kitchen.getId());
            List<QuotationDoorDto> doors = loadDoorsForKitchen(kitchen.getId());
            List<QuotationLightingDto> lighting = loadLightingForKitchen(kitchen.getId());
            
            System.out.println("Loaded " + (accessories != null ? accessories.size() : 0) + " accessories for kitchen " + kitchen.getId());
            System.out.println("Loaded " + (cabinets != null ? cabinets.size() : 0) + " cabinets for kitchen " + kitchen.getId());
            System.out.println("Loaded " + (doors != null ? doors.size() : 0) + " doors for kitchen " + kitchen.getId());
            System.out.println("Loaded " + (lighting != null ? lighting.size() : 0) + " lighting for kitchen " + kitchen.getId());
            
            dto.setAccessories(accessories);
            dto.setCabinets(cabinets);
            dto.setDoors(doors);
            dto.setLighting(lighting);
            dto.setOtherExpenses(loadOtherExpensesForKitchen(kitchen.getId()));

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

            if (cabinet.getCustomDimensions() != null) {
                dto.setCustomDimensions("true".equals(cabinet.getCustomDimensions()));
            }

            // Only show margin to super admin
            if ("ROLE_SUPER_ADMIN".equals(userRole)) {
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

            // CRITICAL: Map cabinet type data for proper name display
            CabinetType cabinetType = cabinet.getCabinetType();
            if (cabinetType != null) {
                dto.setCabinetTypeId(cabinetType.getId());
                dto.setCabinetTypeName(cabinetType.getName()); // THIS IS KEY FOR PDF NAME DISPLAY
            }

            // Map linked door type for PDF display
            if (cabinet.getLinkedDoorType() != null) {
                dto.setLinkedDoorTypeId(cabinet.getLinkedDoorType().getId());
                dto.setLinkedDoorTypeName(cabinet.getLinkedDoorType().getName());
            }

            // Set material, lighting, and accessories fields
            dto.setMaterialId(cabinet.getMaterialId());
            dto.setMaterialRate(cabinet.getMaterialRate());
            dto.setLightingCost(cabinet.getLightingCost());
            dto.setAccessoriesCost(cabinet.getAccessoriesCost());

            // Set kitchen ID if associated
            if (cabinet.getKitchen() != null) {
                dto.setKitchenId(cabinet.getKitchen().getId());
            }

            // Set elevation fields
            dto.setElevationId(cabinet.getElevationId());
            dto.setElevationName(cabinet.getElevationName());

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

            if (door.getCustomDimensions() != null) {
                dto.setCustomDimensions("true".equals(door.getCustomDimensions()));
            }

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

            // CRITICAL: Map door type data for proper name display
            DoorType doorType = door.getDoorType();
            if (doorType != null) {
                dto.setDoorTypeId(doorType.getId());
                dto.setDoorTypeName(doorType.getName()); // THIS IS KEY FOR PDF NAME DISPLAY
            }

            // Set kitchen ID if associated
            if (door.getKitchen() != null) {
                dto.setKitchenId(door.getKitchen().getId());
            }

            // Set elevation fields
            dto.setElevationId(door.getElevationId());
            dto.setElevationName(door.getElevationName());

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
            dto.setItemName(lighting.getItemName()); // THIS IS KEY FOR PDF NAME DISPLAY
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
                BigDecimal baseAmount = lighting.getUnitPrice().multiply(lighting.getQuantity());
                BigDecimal marginAmount = pricingService.calculateMarginAmount(baseAmount, lighting.getQuotation().getMarginPercentage());
                BigDecimal taxAmount = pricingService.calculateTaxAmount(baseAmount.add(marginAmount), lighting.getQuotation().getTaxPercentage());

                dto.setMarginAmount(marginAmount);
                dto.setTaxAmount(taxAmount);
            }

            // Set kitchen ID if associated
            if (lighting.getKitchen() != null) {
                dto.setKitchenId(lighting.getKitchen().getId());
            }

            return dto;
        }).toList();
    }

    private List<QuotationOtherExpenseDto> loadOtherExpenses(Long quotationId) {
        List<QuotationOtherExpense> expenses = otherExpenseRepository.findByQuotationIdAndKitchenIsNull(quotationId);
        return expenses.stream().map(expense -> {
            QuotationOtherExpenseDto dto = new QuotationOtherExpenseDto();
            dto.setId(expense.getId());
            dto.setName(expense.getName());
            dto.setAmount(expense.getAmount());
            dto.setIsDefault(expense.getIsDefault());
            return dto;
        }).toList();
    }

    private List<QuotationOtherExpenseDto> loadOtherExpensesForKitchen(Long kitchenId) {
        List<QuotationOtherExpense> expenses = otherExpenseRepository.findByKitchenId(kitchenId);
        return expenses.stream().map(expense -> {
            QuotationOtherExpenseDto dto = new QuotationOtherExpenseDto();
            dto.setId(expense.getId());
            dto.setName(expense.getName());
            dto.setAmount(expense.getAmount());
            dto.setIsDefault(expense.getIsDefault());
            return dto;
        }).toList();
    }

    // Helper methods to load products for a specific kitchen
    private List<QuotationAccessoryDto> loadAccessoriesForKitchen(Long kitchenId) {
        System.out.println("loadAccessoriesForKitchen called with kitchenId: " + kitchenId);
        List<QuotationAccessory> accessories = accessoryRepository.findByKitchenId(kitchenId);
        System.out.println("Found " + (accessories != null ? accessories.size() : 0) + " accessories in database for kitchenId: " + kitchenId);
        return accessories.stream().map(quotationAccessory -> {
            QuotationAccessoryDto dto = new QuotationAccessoryDto();
            dto.setId(quotationAccessory.getId());
            dto.setQuantity(quotationAccessory.getQuantity());
            dto.setUnitPrice(quotationAccessory.getUnitPrice());
            dto.setTotalPrice(quotationAccessory.getTotalPrice());
            dto.setDescription(quotationAccessory.getDescription());
            dto.setCustomItem(quotationAccessory.getCustomItem());
            dto.setCustomItemName(quotationAccessory.getCustomItemName());
            dto.setKitchenId(kitchenId);

            Accessory accessory = quotationAccessory.getAccessory();
            if (accessory != null) {
                dto.setAccessoryId(accessory.getId());
                dto.setAccessoryName(accessory.getName());

                // Brand and category info
                if (accessory.getBrand() != null) {
                    dto.setBrandName(accessory.getBrand().getName());
                }
                if (accessory.getCategory() != null) {
                    dto.setCategoryName(accessory.getCategory().getName());
                }
            } else if (quotationAccessory.getCustomItem() != null && quotationAccessory.getCustomItem()) {
                dto.setAccessoryName(quotationAccessory.getCustomItemName());
            }

            // Set elevation fields
            dto.setElevationId(quotationAccessory.getElevationId());
            dto.setElevationName(quotationAccessory.getElevationName());

            return dto;
        }).toList();
    }

    private List<QuotationCabinetDto> loadCabinetsForKitchen(Long kitchenId) {
        System.out.println("loadCabinetsForKitchen called with kitchenId: " + kitchenId);
        List<QuotationCabinet> cabinets = cabinetRepository.findByKitchenId(kitchenId);
        System.out.println("Found " + (cabinets != null ? cabinets.size() : 0) + " cabinets in database for kitchenId: " + kitchenId);
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
            dto.setKitchenId(kitchenId);

            if (cabinet.getCustomDimensions() != null) {
                dto.setCustomDimensions("true".equals(cabinet.getCustomDimensions()));
            }

            CabinetType cabinetType = cabinet.getCabinetType();
            if (cabinetType != null) {
                dto.setCabinetTypeId(cabinetType.getId());
                dto.setCabinetTypeName(cabinetType.getName());
            }

            // Map linked door type for PDF display
            if (cabinet.getLinkedDoorType() != null) {
                dto.setLinkedDoorTypeId(cabinet.getLinkedDoorType().getId());
                dto.setLinkedDoorTypeName(cabinet.getLinkedDoorType().getName());
            }

            // Set material, lighting, and accessories fields
            dto.setMaterialId(cabinet.getMaterialId());
            dto.setMaterialRate(cabinet.getMaterialRate());
            dto.setLightingCost(cabinet.getLightingCost());
            dto.setAccessoriesCost(cabinet.getAccessoriesCost());

            // Set elevation fields
            dto.setElevationId(cabinet.getElevationId());
            dto.setElevationName(cabinet.getElevationName());

            return dto;
        }).toList();
    }

    private List<QuotationDoorDto> loadDoorsForKitchen(Long kitchenId) {
        System.out.println("loadDoorsForKitchen called with kitchenId: " + kitchenId);
        List<QuotationDoor> doors = doorRepository.findByKitchenId(kitchenId);
        System.out.println("Found " + (doors != null ? doors.size() : 0) + " doors in database for kitchenId: " + kitchenId);
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
            dto.setKitchenId(kitchenId);

            if (door.getCustomDimensions() != null) {
                dto.setCustomDimensions("true".equals(door.getCustomDimensions()));
            }

            DoorType doorType = door.getDoorType();
            if (doorType != null) {
                dto.setDoorTypeId(doorType.getId());
                dto.setDoorTypeName(doorType.getName());
            }

            // Set elevation fields
            dto.setElevationId(door.getElevationId());
            dto.setElevationName(door.getElevationName());

            return dto;
        }).toList();
    }

    private List<QuotationLightingDto> loadLightingForKitchen(Long kitchenId) {
        System.out.println("loadLightingForKitchen called with kitchenId: " + kitchenId);
        List<QuotationLighting> lightingList = lightingRepository.findByKitchenId(kitchenId);
        System.out.println("Found " + (lightingList != null ? lightingList.size() : 0) + " lighting items in database for kitchenId: " + kitchenId);
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
            dto.setKitchenId(kitchenId);

            return dto;
        }).toList();
    }

    // Signature Integration Methods
    @Override
    public ApiResponse<String> linkSignedDocument(Long quotationId, SignedDocument signedDocument) {
        Quotation quotation = quotationRepository.findById(quotationId).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        quotation.setSignedDocument(signedDocument);
        quotationRepository.save(quotation);

        return ApiResponse.success("Signed document linked to quotation successfully");
    }

    @Override
    public ApiResponse<String> updateQuotationAfterSignature(Long quotationId, Long signedDocumentId, LocalDateTime signedAt) {
        Quotation quotation = quotationRepository.findById(quotationId).orElse(null);
        if (quotation == null) {
            return ApiResponse.error("Quotation not found");
        }

        // Update quotation with signature information
        quotation.setQuotationSignedAt(signedAt);

        // Automatically approve the quotation when signed
        if (quotation.getStatus() != Quotation.QuotationStatus.APPROVED) {
            quotation.setStatus(Quotation.QuotationStatus.APPROVED);
            quotation.setApprovedAt(LocalDate.now());
            quotation.setApprovedBy("Customer (Digital Signature)");
        }

        quotationRepository.save(quotation);

        return ApiResponse.success("Quotation updated successfully after signature");
    }
}