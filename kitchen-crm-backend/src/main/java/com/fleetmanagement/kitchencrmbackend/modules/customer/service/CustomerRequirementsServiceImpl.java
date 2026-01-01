package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsCreateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.CustomerRequirementsUpdateDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerRequirements;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRequirementsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CustomerRequirementsServiceImpl implements CustomerRequirementsService {

    @Autowired
    private CustomerRequirementsRepository requirementsRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public ApiResponse<CustomerRequirementsDto> getRequirementsByCustomerId(Long customerId) {
        CustomerRequirements requirements = requirementsRepository.findByCustomerId(customerId)
                .orElse(null);
        
        if (requirements == null) {
            return ApiResponse.error("Requirements not found for customer ID: " + customerId);
        }
        
        return ApiResponse.success(convertToDto(requirements));
    }

    @Override
    public ApiResponse<CustomerRequirementsDto> createRequirements(Long customerId, 
                                                                 CustomerRequirementsCreateDto dto, 
                                                                 String createdBy) {
        // Check if customer exists
        Customer customer = customerRepository.findById(customerId)
                .orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found with ID: " + customerId);
        }

        // Check if requirements already exist
        if (requirementsRepository.existsByCustomerId(customerId)) {
            return ApiResponse.error("Requirements already exist for this customer. Use update instead.");
        }

        CustomerRequirements requirements = convertToEntity(dto);
        requirements.setCustomer(customer);
        
        CustomerRequirements saved = requirementsRepository.save(requirements);
        return ApiResponse.success("Requirements created successfully", convertToDto(saved));
    }

    @Override
    public ApiResponse<CustomerRequirementsDto> updateRequirements(Long customerId, 
                                                                     CustomerRequirementsUpdateDto dto, 
                                                                     String updatedBy) {
        CustomerRequirements existing = requirementsRepository.findByCustomerId(customerId)
                .orElse(null);
        
        if (existing == null) {
            return ApiResponse.error("Requirements not found for customer ID: " + customerId);
        }

        // Update all fields from DTO
        updateEntityFromDto(existing, dto);
        
        CustomerRequirements updated = requirementsRepository.save(existing);
        return ApiResponse.success("Requirements updated successfully", convertToDto(updated));
    }

    @Override
    public ApiResponse<String> deleteRequirements(Long customerId) {
        CustomerRequirements requirements = requirementsRepository.findByCustomerId(customerId)
                .orElse(null);
        
        if (requirements == null) {
            return ApiResponse.error("Requirements not found for customer ID: " + customerId);
        }
        
        requirementsRepository.delete(requirements);
        return ApiResponse.success("Requirements deleted successfully");
    }

    private CustomerRequirementsDto convertToDto(CustomerRequirements entity) {
        CustomerRequirementsDto dto = new CustomerRequirementsDto();
        dto.setId(entity.getId());
        dto.setCustomerId(entity.getCustomer().getId());
        
        // Copy all boolean fields
        dto.setCabinetWpc(entity.getCabinetWpc());
        dto.setCabinetSs(entity.getCabinetSs());
        dto.setDoorWpc(entity.getDoorWpc());
        dto.setDoorSs(entity.getDoorSs());
        dto.setFinishGlax(entity.getFinishGlax());
        dto.setFinishCeramic(entity.getFinishCeramic());
        dto.setFinishGlass(entity.getFinishGlass());
        dto.setFinishPu(entity.getFinishPu());
        dto.setFinishLaminate(entity.getFinishLaminate());
        dto.setLayoutLShape(entity.getLayoutLShape());
        dto.setLayoutUShape(entity.getLayoutUShape());
        dto.setLayoutCShape(entity.getLayoutCShape());
        dto.setLayoutGShape(entity.getLayoutGShape());
        dto.setLayoutIsland(entity.getLayoutIsland());
        dto.setLayoutLinear(entity.getLayoutLinear());
        dto.setLayoutParallel(entity.getLayoutParallel());
        dto.setDesignIsland(entity.getDesignIsland());
        dto.setDesignBreakfast(entity.getDesignBreakfast());
        dto.setDesignBarUnit(entity.getDesignBarUnit());
        dto.setDesignPantryUnit(entity.getDesignPantryUnit());
        dto.setCabinetTallUnits(entity.getCabinetTallUnits());
        dto.setCabinetBaseUnits(entity.getCabinetBaseUnits());
        dto.setCabinetWallUnits(entity.getCabinetWallUnits());
        dto.setCabinetLoftUnits(entity.getCabinetLoftUnits());
        dto.setBaseDrawers(entity.getBaseDrawers());
        dto.setBaseHingeDoors(entity.getBaseHingeDoors());
        dto.setBasePullouts(entity.getBasePullouts());
        dto.setBaseWickerBasket(entity.getBaseWickerBasket());
        dto.setWallUnitImove(entity.getWallUnitImove());
        dto.setWallHingeDoors(entity.getWallHingeDoors());
        dto.setWallBifoldLiftup(entity.getWallBifoldLiftup());
        dto.setWallBifoldMotorised(entity.getWallBifoldMotorised());
        dto.setWallFlapup(entity.getWallFlapup());
        dto.setWallRollingShutter(entity.getWallRollingShutter());
        dto.setTallUnitPantryPullout(entity.getTallUnitPantryPullout());
        dto.setLavidoPullout(entity.getLavidoPullout());
        dto.setTallUnitSsShelves(entity.getTallUnitSsShelves());
        dto.setTallUnitGlassShelf(entity.getTallUnitGlassShelf());
        dto.setHandleG(entity.getHandleG());
        dto.setHandleJ(entity.getHandleJ());
        dto.setHandleGola(entity.getHandleGola());
        dto.setHandleLipProfile(entity.getHandleLipProfile());
        dto.setHandleExposeHandless(entity.getHandleExposeHandless());
        dto.setInbuiltHandles(entity.getInbuiltHandles());
        dto.setHandleColorRoseGold(entity.getHandleColorRoseGold());
        dto.setHandleColorSilver(entity.getHandleColorSilver());
        dto.setHandleColorGold(entity.getHandleColorGold());
        dto.setHandleColorBlack(entity.getHandleColorBlack());
        dto.setProfileLights(entity.getProfileLights());
        dto.setOvenBuiltIn(entity.getOvenBuiltIn());
        dto.setOvenFreeStanding(entity.getOvenFreeStanding());
        dto.setRefrigeratorBuiltIn(entity.getRefrigeratorBuiltIn());
        dto.setRefrigeratorFreeStanding(entity.getRefrigeratorFreeStanding());
        dto.setDishwasherBuiltIn(entity.getDishwasherBuiltIn());
        dto.setDishwasherFreeStanding(entity.getDishwasherFreeStanding());
        dto.setCoffeeMakerBuiltIn(entity.getCoffeeMakerBuiltIn());
        dto.setCoffeeMakerFreeStanding(entity.getCoffeeMakerFreeStanding());
        dto.setCookTop90(entity.getCookTop90());
        dto.setCookTop60(entity.getCookTop60());
        dto.setCookTop120(entity.getCookTop120());
        dto.setSinkDoubleBowl(entity.getSinkDoubleBowl());
        dto.setSinkSingleBowl(entity.getSinkSingleBowl());
        dto.setSinkDoubleWithDrain(entity.getSinkDoubleWithDrain());
        dto.setSinkMultifunction(entity.getSinkMultifunction());
        dto.setSinkBaseDrawers(entity.getSinkBaseDrawers());
        dto.setSinkBaseDoors(entity.getSinkBaseDoors());
        dto.setSinkBaseWasteBin(entity.getSinkBaseWasteBin());
        dto.setSinkBaseDetergentHolder(entity.getSinkBaseDetergentHolder());
        dto.setSinkBaseDetergentPullouts(entity.getSinkBaseDetergentPullouts());
        dto.setSinkBaseWastebinPullout(entity.getSinkBaseWastebinPullout());
        dto.setCornerSolutionLemans(entity.getCornerSolutionLemans());
        dto.setCornerSolutionMagicCorner(entity.getCornerSolutionMagicCorner());
        dto.setCornerSolutionShelves(entity.getCornerSolutionShelves());
        dto.setBuiltInSinkOverCounter(entity.getBuiltInSinkOverCounter());
        dto.setBuiltInSinkUnderCounter(entity.getBuiltInSinkUnderCounter());
        dto.setCountertopQuartz(entity.getCountertopQuartz());
        dto.setCountertopGranite(entity.getCountertopGranite());
        dto.setCountertopTiles(entity.getCountertopTiles());
        dto.setTimeline4560Days(entity.getTimeline4560Days());
        dto.setTimeline6090Days(entity.getTimeline6090Days());
        dto.setTimelineAbove90Days(entity.getTimelineAbove90Days());
        
        // Copy text fields
        dto.setAestheticsAndColors(entity.getAestheticsAndColors());
        dto.setInteriorDesigner(entity.getInteriorDesigner());
        dto.setComments(entity.getComments());
        
        // Copy audit fields
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        
        return dto;
    }

    private CustomerRequirements convertToEntity(CustomerRequirementsCreateDto dto) {
        CustomerRequirements entity = new CustomerRequirements();
        
        // Set all boolean fields (default to false if null)
        entity.setCabinetWpc(dto.getCabinetWpc() != null ? dto.getCabinetWpc() : false);
        entity.setCabinetSs(dto.getCabinetSs() != null ? dto.getCabinetSs() : false);
        entity.setDoorWpc(dto.getDoorWpc() != null ? dto.getDoorWpc() : false);
        entity.setDoorSs(dto.getDoorSs() != null ? dto.getDoorSs() : false);
        entity.setFinishGlax(dto.getFinishGlax() != null ? dto.getFinishGlax() : false);
        entity.setFinishCeramic(dto.getFinishCeramic() != null ? dto.getFinishCeramic() : false);
        entity.setFinishGlass(dto.getFinishGlass() != null ? dto.getFinishGlass() : false);
        entity.setFinishPu(dto.getFinishPu() != null ? dto.getFinishPu() : false);
        entity.setFinishLaminate(dto.getFinishLaminate() != null ? dto.getFinishLaminate() : false);
        entity.setLayoutLShape(dto.getLayoutLShape() != null ? dto.getLayoutLShape() : false);
        entity.setLayoutUShape(dto.getLayoutUShape() != null ? dto.getLayoutUShape() : false);
        entity.setLayoutCShape(dto.getLayoutCShape() != null ? dto.getLayoutCShape() : false);
        entity.setLayoutGShape(dto.getLayoutGShape() != null ? dto.getLayoutGShape() : false);
        entity.setLayoutIsland(dto.getLayoutIsland() != null ? dto.getLayoutIsland() : false);
        entity.setLayoutLinear(dto.getLayoutLinear() != null ? dto.getLayoutLinear() : false);
        entity.setLayoutParallel(dto.getLayoutParallel() != null ? dto.getLayoutParallel() : false);
        entity.setDesignIsland(dto.getDesignIsland() != null ? dto.getDesignIsland() : false);
        entity.setDesignBreakfast(dto.getDesignBreakfast() != null ? dto.getDesignBreakfast() : false);
        entity.setDesignBarUnit(dto.getDesignBarUnit() != null ? dto.getDesignBarUnit() : false);
        entity.setDesignPantryUnit(dto.getDesignPantryUnit() != null ? dto.getDesignPantryUnit() : false);
        entity.setCabinetTallUnits(dto.getCabinetTallUnits() != null ? dto.getCabinetTallUnits() : false);
        entity.setCabinetBaseUnits(dto.getCabinetBaseUnits() != null ? dto.getCabinetBaseUnits() : false);
        entity.setCabinetWallUnits(dto.getCabinetWallUnits() != null ? dto.getCabinetWallUnits() : false);
        entity.setCabinetLoftUnits(dto.getCabinetLoftUnits() != null ? dto.getCabinetLoftUnits() : false);
        entity.setBaseDrawers(dto.getBaseDrawers() != null ? dto.getBaseDrawers() : false);
        entity.setBaseHingeDoors(dto.getBaseHingeDoors() != null ? dto.getBaseHingeDoors() : false);
        entity.setBasePullouts(dto.getBasePullouts() != null ? dto.getBasePullouts() : false);
        entity.setBaseWickerBasket(dto.getBaseWickerBasket() != null ? dto.getBaseWickerBasket() : false);
        entity.setWallUnitImove(dto.getWallUnitImove() != null ? dto.getWallUnitImove() : false);
        entity.setWallHingeDoors(dto.getWallHingeDoors() != null ? dto.getWallHingeDoors() : false);
        entity.setWallBifoldLiftup(dto.getWallBifoldLiftup() != null ? dto.getWallBifoldLiftup() : false);
        entity.setWallBifoldMotorised(dto.getWallBifoldMotorised() != null ? dto.getWallBifoldMotorised() : false);
        entity.setWallFlapup(dto.getWallFlapup() != null ? dto.getWallFlapup() : false);
        entity.setWallRollingShutter(dto.getWallRollingShutter() != null ? dto.getWallRollingShutter() : false);
        entity.setTallUnitPantryPullout(dto.getTallUnitPantryPullout() != null ? dto.getTallUnitPantryPullout() : false);
        entity.setLavidoPullout(dto.getLavidoPullout() != null ? dto.getLavidoPullout() : false);
        entity.setTallUnitSsShelves(dto.getTallUnitSsShelves() != null ? dto.getTallUnitSsShelves() : false);
        entity.setTallUnitGlassShelf(dto.getTallUnitGlassShelf() != null ? dto.getTallUnitGlassShelf() : false);
        entity.setHandleG(dto.getHandleG() != null ? dto.getHandleG() : false);
        entity.setHandleJ(dto.getHandleJ() != null ? dto.getHandleJ() : false);
        entity.setHandleGola(dto.getHandleGola() != null ? dto.getHandleGola() : false);
        entity.setHandleLipProfile(dto.getHandleLipProfile() != null ? dto.getHandleLipProfile() : false);
        entity.setHandleExposeHandless(dto.getHandleExposeHandless() != null ? dto.getHandleExposeHandless() : false);
        entity.setInbuiltHandles(dto.getInbuiltHandles() != null ? dto.getInbuiltHandles() : false);
        entity.setHandleColorRoseGold(dto.getHandleColorRoseGold() != null ? dto.getHandleColorRoseGold() : false);
        entity.setHandleColorSilver(dto.getHandleColorSilver() != null ? dto.getHandleColorSilver() : false);
        entity.setHandleColorGold(dto.getHandleColorGold() != null ? dto.getHandleColorGold() : false);
        entity.setHandleColorBlack(dto.getHandleColorBlack() != null ? dto.getHandleColorBlack() : false);
        entity.setProfileLights(dto.getProfileLights() != null ? dto.getProfileLights() : false);
        entity.setOvenBuiltIn(dto.getOvenBuiltIn() != null ? dto.getOvenBuiltIn() : false);
        entity.setOvenFreeStanding(dto.getOvenFreeStanding() != null ? dto.getOvenFreeStanding() : false);
        entity.setRefrigeratorBuiltIn(dto.getRefrigeratorBuiltIn() != null ? dto.getRefrigeratorBuiltIn() : false);
        entity.setRefrigeratorFreeStanding(dto.getRefrigeratorFreeStanding() != null ? dto.getRefrigeratorFreeStanding() : false);
        entity.setDishwasherBuiltIn(dto.getDishwasherBuiltIn() != null ? dto.getDishwasherBuiltIn() : false);
        entity.setDishwasherFreeStanding(dto.getDishwasherFreeStanding() != null ? dto.getDishwasherFreeStanding() : false);
        entity.setCoffeeMakerBuiltIn(dto.getCoffeeMakerBuiltIn() != null ? dto.getCoffeeMakerBuiltIn() : false);
        entity.setCoffeeMakerFreeStanding(dto.getCoffeeMakerFreeStanding() != null ? dto.getCoffeeMakerFreeStanding() : false);
        entity.setCookTop90(dto.getCookTop90() != null ? dto.getCookTop90() : false);
        entity.setCookTop60(dto.getCookTop60() != null ? dto.getCookTop60() : false);
        entity.setCookTop120(dto.getCookTop120() != null ? dto.getCookTop120() : false);
        entity.setSinkDoubleBowl(dto.getSinkDoubleBowl() != null ? dto.getSinkDoubleBowl() : false);
        entity.setSinkSingleBowl(dto.getSinkSingleBowl() != null ? dto.getSinkSingleBowl() : false);
        entity.setSinkDoubleWithDrain(dto.getSinkDoubleWithDrain() != null ? dto.getSinkDoubleWithDrain() : false);
        entity.setSinkMultifunction(dto.getSinkMultifunction() != null ? dto.getSinkMultifunction() : false);
        entity.setSinkBaseDrawers(dto.getSinkBaseDrawers() != null ? dto.getSinkBaseDrawers() : false);
        entity.setSinkBaseDoors(dto.getSinkBaseDoors() != null ? dto.getSinkBaseDoors() : false);
        entity.setSinkBaseWasteBin(dto.getSinkBaseWasteBin() != null ? dto.getSinkBaseWasteBin() : false);
        entity.setSinkBaseDetergentHolder(dto.getSinkBaseDetergentHolder() != null ? dto.getSinkBaseDetergentHolder() : false);
        entity.setSinkBaseDetergentPullouts(dto.getSinkBaseDetergentPullouts() != null ? dto.getSinkBaseDetergentPullouts() : false);
        entity.setSinkBaseWastebinPullout(dto.getSinkBaseWastebinPullout() != null ? dto.getSinkBaseWastebinPullout() : false);
        entity.setCornerSolutionLemans(dto.getCornerSolutionLemans() != null ? dto.getCornerSolutionLemans() : false);
        entity.setCornerSolutionMagicCorner(dto.getCornerSolutionMagicCorner() != null ? dto.getCornerSolutionMagicCorner() : false);
        entity.setCornerSolutionShelves(dto.getCornerSolutionShelves() != null ? dto.getCornerSolutionShelves() : false);
        entity.setBuiltInSinkOverCounter(dto.getBuiltInSinkOverCounter() != null ? dto.getBuiltInSinkOverCounter() : false);
        entity.setBuiltInSinkUnderCounter(dto.getBuiltInSinkUnderCounter() != null ? dto.getBuiltInSinkUnderCounter() : false);
        entity.setCountertopQuartz(dto.getCountertopQuartz() != null ? dto.getCountertopQuartz() : false);
        entity.setCountertopGranite(dto.getCountertopGranite() != null ? dto.getCountertopGranite() : false);
        entity.setCountertopTiles(dto.getCountertopTiles() != null ? dto.getCountertopTiles() : false);
        entity.setTimeline4560Days(dto.getTimeline4560Days() != null ? dto.getTimeline4560Days() : false);
        entity.setTimeline6090Days(dto.getTimeline6090Days() != null ? dto.getTimeline6090Days() : false);
        entity.setTimelineAbove90Days(dto.getTimelineAbove90Days() != null ? dto.getTimelineAbove90Days() : false);
        
        // Set text fields
        entity.setAestheticsAndColors(dto.getAestheticsAndColors());
        entity.setInteriorDesigner(dto.getInteriorDesigner());
        entity.setComments(dto.getComments());
        
        return entity;
    }

    private void updateEntityFromDto(CustomerRequirements entity, CustomerRequirementsUpdateDto dto) {
        // Update boolean fields only if provided (not null)
        if (dto.getCabinetWpc() != null) entity.setCabinetWpc(dto.getCabinetWpc());
        if (dto.getCabinetSs() != null) entity.setCabinetSs(dto.getCabinetSs());
        if (dto.getDoorWpc() != null) entity.setDoorWpc(dto.getDoorWpc());
        if (dto.getDoorSs() != null) entity.setDoorSs(dto.getDoorSs());
        if (dto.getFinishGlax() != null) entity.setFinishGlax(dto.getFinishGlax());
        if (dto.getFinishCeramic() != null) entity.setFinishCeramic(dto.getFinishCeramic());
        if (dto.getFinishGlass() != null) entity.setFinishGlass(dto.getFinishGlass());
        if (dto.getFinishPu() != null) entity.setFinishPu(dto.getFinishPu());
        if (dto.getFinishLaminate() != null) entity.setFinishLaminate(dto.getFinishLaminate());
        if (dto.getLayoutLShape() != null) entity.setLayoutLShape(dto.getLayoutLShape());
        if (dto.getLayoutUShape() != null) entity.setLayoutUShape(dto.getLayoutUShape());
        if (dto.getLayoutCShape() != null) entity.setLayoutCShape(dto.getLayoutCShape());
        if (dto.getLayoutGShape() != null) entity.setLayoutGShape(dto.getLayoutGShape());
        if (dto.getLayoutIsland() != null) entity.setLayoutIsland(dto.getLayoutIsland());
        if (dto.getLayoutLinear() != null) entity.setLayoutLinear(dto.getLayoutLinear());
        if (dto.getLayoutParallel() != null) entity.setLayoutParallel(dto.getLayoutParallel());
        if (dto.getDesignIsland() != null) entity.setDesignIsland(dto.getDesignIsland());
        if (dto.getDesignBreakfast() != null) entity.setDesignBreakfast(dto.getDesignBreakfast());
        if (dto.getDesignBarUnit() != null) entity.setDesignBarUnit(dto.getDesignBarUnit());
        if (dto.getDesignPantryUnit() != null) entity.setDesignPantryUnit(dto.getDesignPantryUnit());
        if (dto.getCabinetTallUnits() != null) entity.setCabinetTallUnits(dto.getCabinetTallUnits());
        if (dto.getCabinetBaseUnits() != null) entity.setCabinetBaseUnits(dto.getCabinetBaseUnits());
        if (dto.getCabinetWallUnits() != null) entity.setCabinetWallUnits(dto.getCabinetWallUnits());
        if (dto.getCabinetLoftUnits() != null) entity.setCabinetLoftUnits(dto.getCabinetLoftUnits());
        if (dto.getBaseDrawers() != null) entity.setBaseDrawers(dto.getBaseDrawers());
        if (dto.getBaseHingeDoors() != null) entity.setBaseHingeDoors(dto.getBaseHingeDoors());
        if (dto.getBasePullouts() != null) entity.setBasePullouts(dto.getBasePullouts());
        if (dto.getBaseWickerBasket() != null) entity.setBaseWickerBasket(dto.getBaseWickerBasket());
        if (dto.getWallUnitImove() != null) entity.setWallUnitImove(dto.getWallUnitImove());
        if (dto.getWallHingeDoors() != null) entity.setWallHingeDoors(dto.getWallHingeDoors());
        if (dto.getWallBifoldLiftup() != null) entity.setWallBifoldLiftup(dto.getWallBifoldLiftup());
        if (dto.getWallBifoldMotorised() != null) entity.setWallBifoldMotorised(dto.getWallBifoldMotorised());
        if (dto.getWallFlapup() != null) entity.setWallFlapup(dto.getWallFlapup());
        if (dto.getWallRollingShutter() != null) entity.setWallRollingShutter(dto.getWallRollingShutter());
        if (dto.getTallUnitPantryPullout() != null) entity.setTallUnitPantryPullout(dto.getTallUnitPantryPullout());
        if (dto.getLavidoPullout() != null) entity.setLavidoPullout(dto.getLavidoPullout());
        if (dto.getTallUnitSsShelves() != null) entity.setTallUnitSsShelves(dto.getTallUnitSsShelves());
        if (dto.getTallUnitGlassShelf() != null) entity.setTallUnitGlassShelf(dto.getTallUnitGlassShelf());
        if (dto.getHandleG() != null) entity.setHandleG(dto.getHandleG());
        if (dto.getHandleJ() != null) entity.setHandleJ(dto.getHandleJ());
        if (dto.getHandleGola() != null) entity.setHandleGola(dto.getHandleGola());
        if (dto.getHandleLipProfile() != null) entity.setHandleLipProfile(dto.getHandleLipProfile());
        if (dto.getHandleExposeHandless() != null) entity.setHandleExposeHandless(dto.getHandleExposeHandless());
        if (dto.getInbuiltHandles() != null) entity.setInbuiltHandles(dto.getInbuiltHandles());
        if (dto.getHandleColorRoseGold() != null) entity.setHandleColorRoseGold(dto.getHandleColorRoseGold());
        if (dto.getHandleColorSilver() != null) entity.setHandleColorSilver(dto.getHandleColorSilver());
        if (dto.getHandleColorGold() != null) entity.setHandleColorGold(dto.getHandleColorGold());
        if (dto.getHandleColorBlack() != null) entity.setHandleColorBlack(dto.getHandleColorBlack());
        if (dto.getProfileLights() != null) entity.setProfileLights(dto.getProfileLights());
        if (dto.getOvenBuiltIn() != null) entity.setOvenBuiltIn(dto.getOvenBuiltIn());
        if (dto.getOvenFreeStanding() != null) entity.setOvenFreeStanding(dto.getOvenFreeStanding());
        if (dto.getRefrigeratorBuiltIn() != null) entity.setRefrigeratorBuiltIn(dto.getRefrigeratorBuiltIn());
        if (dto.getRefrigeratorFreeStanding() != null) entity.setRefrigeratorFreeStanding(dto.getRefrigeratorFreeStanding());
        if (dto.getDishwasherBuiltIn() != null) entity.setDishwasherBuiltIn(dto.getDishwasherBuiltIn());
        if (dto.getDishwasherFreeStanding() != null) entity.setDishwasherFreeStanding(dto.getDishwasherFreeStanding());
        if (dto.getCoffeeMakerBuiltIn() != null) entity.setCoffeeMakerBuiltIn(dto.getCoffeeMakerBuiltIn());
        if (dto.getCoffeeMakerFreeStanding() != null) entity.setCoffeeMakerFreeStanding(dto.getCoffeeMakerFreeStanding());
        if (dto.getCookTop90() != null) entity.setCookTop90(dto.getCookTop90());
        if (dto.getCookTop60() != null) entity.setCookTop60(dto.getCookTop60());
        if (dto.getCookTop120() != null) entity.setCookTop120(dto.getCookTop120());
        if (dto.getSinkDoubleBowl() != null) entity.setSinkDoubleBowl(dto.getSinkDoubleBowl());
        if (dto.getSinkSingleBowl() != null) entity.setSinkSingleBowl(dto.getSinkSingleBowl());
        if (dto.getSinkDoubleWithDrain() != null) entity.setSinkDoubleWithDrain(dto.getSinkDoubleWithDrain());
        if (dto.getSinkMultifunction() != null) entity.setSinkMultifunction(dto.getSinkMultifunction());
        if (dto.getSinkBaseDrawers() != null) entity.setSinkBaseDrawers(dto.getSinkBaseDrawers());
        if (dto.getSinkBaseDoors() != null) entity.setSinkBaseDoors(dto.getSinkBaseDoors());
        if (dto.getSinkBaseWasteBin() != null) entity.setSinkBaseWasteBin(dto.getSinkBaseWasteBin());
        if (dto.getSinkBaseDetergentHolder() != null) entity.setSinkBaseDetergentHolder(dto.getSinkBaseDetergentHolder());
        if (dto.getSinkBaseDetergentPullouts() != null) entity.setSinkBaseDetergentPullouts(dto.getSinkBaseDetergentPullouts());
        if (dto.getSinkBaseWastebinPullout() != null) entity.setSinkBaseWastebinPullout(dto.getSinkBaseWastebinPullout());
        if (dto.getCornerSolutionLemans() != null) entity.setCornerSolutionLemans(dto.getCornerSolutionLemans());
        if (dto.getCornerSolutionMagicCorner() != null) entity.setCornerSolutionMagicCorner(dto.getCornerSolutionMagicCorner());
        if (dto.getCornerSolutionShelves() != null) entity.setCornerSolutionShelves(dto.getCornerSolutionShelves());
        if (dto.getBuiltInSinkOverCounter() != null) entity.setBuiltInSinkOverCounter(dto.getBuiltInSinkOverCounter());
        if (dto.getBuiltInSinkUnderCounter() != null) entity.setBuiltInSinkUnderCounter(dto.getBuiltInSinkUnderCounter());
        if (dto.getCountertopQuartz() != null) entity.setCountertopQuartz(dto.getCountertopQuartz());
        if (dto.getCountertopGranite() != null) entity.setCountertopGranite(dto.getCountertopGranite());
        if (dto.getCountertopTiles() != null) entity.setCountertopTiles(dto.getCountertopTiles());
        if (dto.getTimeline4560Days() != null) entity.setTimeline4560Days(dto.getTimeline4560Days());
        if (dto.getTimeline6090Days() != null) entity.setTimeline6090Days(dto.getTimeline6090Days());
        if (dto.getTimelineAbove90Days() != null) entity.setTimelineAbove90Days(dto.getTimelineAbove90Days());
        
        // Update text fields (allow null to clear)
        entity.setAestheticsAndColors(dto.getAestheticsAndColors());
        entity.setInteriorDesigner(dto.getInteriorDesigner());
        entity.setComments(dto.getComments());
    }
}


