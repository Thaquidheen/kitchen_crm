package com.fleetmanagement.kitchencrmbackend.modules.product.controller;

import com.fleetmanagement.kitchencrmbackend.modules.product.dto.DoorTypeDto;
import com.fleetmanagement.kitchencrmbackend.modules.product.service.DoorService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/doors")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DoorController {

    @Autowired
    private DoorService doorService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DoorTypeDto>>> getAllDoors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String material,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(doorService.getAllDoors(name, brandId, material, active, pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DoorTypeDto>>> getActiveDoors() {
        return ResponseEntity.ok(doorService.getActiveDoors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoorTypeDto>> getDoorById(@PathVariable Long id) {
        ApiResponse<DoorTypeDto> response = doorService.getDoorById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DoorTypeDto>> createDoor(@Valid @RequestBody DoorTypeDto doorDto) {
        ApiResponse<DoorTypeDto> response = doorService.createDoor(doorDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DoorTypeDto>> updateDoor(@PathVariable Long id,
                                                               @Valid @RequestBody DoorTypeDto doorDto) {
        ApiResponse<DoorTypeDto> response = doorService.updateDoor(id, doorDto);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteDoor(@PathVariable Long id) {
        return ResponseEntity.ok(doorService.deleteDoor(id));
    }
}