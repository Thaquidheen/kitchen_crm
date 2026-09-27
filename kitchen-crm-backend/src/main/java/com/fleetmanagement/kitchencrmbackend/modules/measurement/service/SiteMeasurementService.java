package com.fleetmanagement.kitchencrmbackend.modules.measurement.service;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementDto;
import com.fleetmanagement.kitchencrmbackend.modules.measurement.dto.SiteMeasurementSaveRequest;

public interface SiteMeasurementService {

    /** The customer's measurements, or an empty record (layout null) if none were taken yet. */
    ApiResponse<SiteMeasurementDto> getForCustomer(Long customerId);

    /** Replace layout + values; values missing from the request are removed. */
    ApiResponse<SiteMeasurementDto> saveForCustomer(Long customerId, SiteMeasurementSaveRequest request, String actor);
}
