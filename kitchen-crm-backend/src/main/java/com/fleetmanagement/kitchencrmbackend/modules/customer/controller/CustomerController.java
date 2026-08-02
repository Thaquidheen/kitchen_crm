package com.fleetmanagement.kitchencrmbackend.modules.customer.controller;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.service.CustomerService;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/customers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerController {

    /**
     * Sort keys are interpolated straight into Sort.by(), which throws
     * PropertyReferenceException — surfacing as a 500 — for anything that is not a mapped
     * scalar property. That includes leadSourceType now it is a collection, and has always
     * included any typo a client sends. Unknown keys fall back to createdAt.
     */
    private static final Set<String> SORTABLE = Set.of(
            "name", "email", "contact", "status", "place", "sqft", "createdAt", "updatedAt");

    @Autowired
    private CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerDto>>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Customer.CustomerStatus status,
            @RequestParam(required = false) Customer.LeadSourceType leadSourceType,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String kitchenTypes,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        String safeSortBy = SORTABLE.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(safeSortBy).descending() : Sort.by(safeSortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        LocalDateTime createdFromDt = createdFrom != null ? createdFrom.atStartOfDay() : null;
        LocalDateTime createdToDt = createdTo != null ? createdTo.atTime(LocalTime.MAX) : null;

        return ResponseEntity.ok(customerService.getAllCustomers(
                search, name, email, status, leadSourceType, address, kitchenTypes,
                createdFromDt, createdToDt, pageable));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCustomerStatistics() {
        return ResponseEntity.ok(customerService.getCustomerStatistics());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        ApiResponse<CustomerDto> response = customerService.getCustomerById(id);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(
            @Valid @RequestBody CustomerCreateDto customerCreateDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<CustomerDto> response = customerService.createCustomer(
                customerCreateDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerDto customerDto,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApiResponse<CustomerDto> response = customerService.updateCustomer(
                id, customerDto, currentUser.getName());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.deleteCustomer(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateCustomerStatus(
            @PathVariable Long id,
            @RequestParam Customer.CustomerStatus status,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        return ResponseEntity.ok(customerService.updateCustomerStatus(
                id, status, currentUser.getName(), reason));
    }
}