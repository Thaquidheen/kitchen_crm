package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.PipelineDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.PipelineService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PipelineController {

    @Autowired
    private PipelineService pipelineService;

    @GetMapping("/{customerId}/pipeline")
    public ResponseEntity<ApiResponse<PipelineDto>> getPipelineByCustomerId(@PathVariable Long customerId) {
        ApiResponse<PipelineDto> response = pipelineService.getPipelineByCustomerId(customerId);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{customerId}/pipeline")
    public ResponseEntity<ApiResponse<PipelineDto>> updatePipeline(
            @PathVariable Long customerId,
            @Valid @RequestBody PipelineDto pipelineDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<PipelineDto> response = pipelineService.updatePipeline(
                customerId, pipelineDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}