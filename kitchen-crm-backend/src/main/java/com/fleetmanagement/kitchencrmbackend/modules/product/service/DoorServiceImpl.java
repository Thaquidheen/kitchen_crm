package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.DoorTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.entity.DoorType;
import com.fleetmanagement.kitchencrmbackend.modules.product.repository.DoorTypeRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoorServiceImpl implements DoorService {

    @Autowired
    private DoorTypeRepository doorTypeRepository;

    @Override
    public ApiResponse<Page<DoorTypeDto>> getAllDoors(String name, Long brandId, String material, Boolean active, Pageable pageable) {
        try {
            Page<DoorType> doors = doorTypeRepository.findByFilters(name, brandId, material, active, pageable);
            Page<DoorTypeDto> doorDtos = doors.map(this::convertToDto);
            return ApiResponse.success("Doors retrieved successfully", doorDtos);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve doors: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<List<DoorTypeDto>> getActiveDoors() {
        try {
            List<DoorType> doors = doorTypeRepository.findByActiveTrue();
            List<DoorTypeDto> doorDtos = doors.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ApiResponse.success("Active doors retrieved successfully", doorDtos);
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve active doors: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<DoorTypeDto> getDoorById(Long id) {
        try {
            Optional<DoorType> door = doorTypeRepository.findById(id);
            if (door.isPresent()) {
                return ApiResponse.success("Door found", convertToDto(door.get()));
            } else {
                return ApiResponse.error("Door not found with id: " + id);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to retrieve door: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<DoorTypeDto> createDoor(DoorTypeDto doorDto) {
        try {
            DoorType door = convertToEntity(doorDto);
            DoorType savedDoor = doorTypeRepository.save(door);
            return ApiResponse.success("Door created successfully", convertToDto(savedDoor));
        } catch (Exception e) {
            return ApiResponse.error("Failed to create door: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<DoorTypeDto> updateDoor(Long id, DoorTypeDto doorDto) {
        try {
            Optional<DoorType> existingDoor = doorTypeRepository.findById(id);
            if (existingDoor.isPresent()) {
                DoorType door = existingDoor.get();
                door.setName(doorDto.getName());
                door.setMaterial(doorDto.getMaterial());
                door.setMrp(doorDto.getMrp());
                door.setDiscountPercentage(doorDto.getDiscountPercentage());
                door.setActive(doorDto.getActive());

                DoorType savedDoor = doorTypeRepository.save(door);
                return ApiResponse.success("Door updated successfully", convertToDto(savedDoor));
            } else {
                return ApiResponse.error("Door not found with id: " + id);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to update door: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deleteDoor(Long id) {
        try {
            if (doorTypeRepository.existsById(id)) {
                doorTypeRepository.deleteById(id);
                return ApiResponse.success("Door deleted successfully");
            } else {
                return ApiResponse.error("Door not found with id: " + id);
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to delete door: " + e.getMessage());
        }
    }

    private DoorTypeDto convertToDto(DoorType door) {
        DoorTypeDto dto = new DoorTypeDto();
        dto.setId(door.getId());
        dto.setName(door.getName());
        dto.setBrandId(door.getBrand() != null ? door.getBrand().getId() : null);
        dto.setBrandName(door.getBrand() != null ? door.getBrand().getName() : null);
        dto.setMaterial(door.getMaterial());
        dto.setMrp(door.getMrp());
        dto.setDiscountPercentage(door.getDiscountPercentage());
        dto.setCompanyPrice(door.getCompanyPrice());
        dto.setActive(door.getActive());
        return dto;
    }

    private DoorType convertToEntity(DoorTypeDto dto) {
        DoorType door = new DoorType();
        door.setName(dto.getName());
        door.setMaterial(dto.getMaterial());
        door.setMrp(dto.getMrp());
        door.setDiscountPercentage(dto.getDiscountPercentage());
        door.setActive(dto.getActive() != null ? dto.getActive() : true);
        return door;
    }
}