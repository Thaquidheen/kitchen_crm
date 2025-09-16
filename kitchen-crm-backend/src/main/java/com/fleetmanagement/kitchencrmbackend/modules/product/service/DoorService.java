package com.fleetmanagement.kitchencrmbackend.modules.product.service;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.DoorTypeDto;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DoorService {
    ApiResponse<Page<DoorTypeDto>> getAllDoors(String name, Long brandId, String material, Boolean active, Pageable pageable);
    ApiResponse<List<DoorTypeDto>> getActiveDoors();
    ApiResponse<DoorTypeDto> getDoorById(Long id);
    ApiResponse<DoorTypeDto> createDoor(DoorTypeDto doorDto);
    ApiResponse<DoorTypeDto> updateDoor(Long id, DoorTypeDto doorDto);
    ApiResponse<String> deleteDoor(Long id);
}