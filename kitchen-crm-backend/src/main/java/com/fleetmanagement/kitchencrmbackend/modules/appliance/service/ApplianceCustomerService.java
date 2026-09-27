package com.fleetmanagement.kitchencrmbackend.modules.appliance.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceCustomerDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceFollowUpDto;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.dto.ApplianceFollowUpRequest;
import com.fleetmanagement.kitchencrmbackend.modules.appliance.entity.ApplianceCustomer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface ApplianceCustomerService {
    ApiResponse<Page<ApplianceCustomerDto>> getAll(ApplianceCustomer.Category category,
                                                   ApplianceCustomer.Status status,
                                                   String search, Pageable pageable);
    ApiResponse<ApplianceCustomerDto> getById(Long id);
    ApiResponse<ApplianceCustomerDto> create(ApplianceCustomerDto dto, String createdBy);
    ApiResponse<ApplianceCustomerDto> update(Long id, ApplianceCustomerDto dto);
    ApiResponse<String> delete(Long id);

    /** Attaches one or more quotation PDFs to an entry, keeping any already attached. */
    ApiResponse<ApplianceCustomerDto> uploadQuotations(Long id, org.springframework.web.multipart.MultipartFile[] files);

    /** Removes a single attached quotation PDF. */
    ApiResponse<ApplianceCustomerDto> deleteQuotation(Long id, Long fileId);
    /** Category chip counts are always global; status counts and total value are scoped
     *  to {@code category} so they line up with what the table is showing. */
    ApiResponse<Map<String, Object>> getStatistics(ApplianceCustomer.Category category);

    /** Follow-up call history for an entry, newest call first. */
    ApiResponse<List<ApplianceFollowUpDto>> getFollowUps(Long id, long viewerId);

    /** Logs a call and refreshes the entry's denormalised lastCalledAt. */
    ApiResponse<ApplianceFollowUpDto> addFollowUp(Long id, ApplianceFollowUpRequest request, String author, Long authorUserId);

    /** Removes one logged call (must belong to the entry) and refreshes lastCalledAt. */
    ApiResponse<String> deleteFollowUp(Long id, Long followUpId, long viewerId);
}
