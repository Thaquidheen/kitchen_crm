package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.controller;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.DeviceLabLogDto;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.dto.DeviceLabLogRequest;
import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.service.LaserMeterService;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Device Lab sessions saved for developers (admin-only). */
@RestController
@RequestMapping("/api/v1/laser-meter/lab-logs")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class DeviceLabLogController {

    @Autowired
    private LaserMeterService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeviceLabLogDto>>> list(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(service.getLabLogs(limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeviceLabLogDto>> get(@PathVariable Long id) {
        return LaserMeterAdapterController.respond(service.getLabLog(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeviceLabLogDto>> save(
            @Valid @RequestBody DeviceLabLogRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        return LaserMeterAdapterController.respond(service.saveLabLog(request, user != null ? user.getName() : null));
    }
}
