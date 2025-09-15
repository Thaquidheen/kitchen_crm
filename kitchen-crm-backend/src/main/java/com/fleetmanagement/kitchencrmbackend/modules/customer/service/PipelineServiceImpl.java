package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.PipelineDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.CustomerPipeline;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.WorkflowHistory;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerPipelineRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.WorkflowHistoryRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class PipelineServiceImpl implements PipelineService {

    @Autowired
    private CustomerPipelineRepository pipelineRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    @Override
    public ApiResponse<PipelineDto> getPipelineByCustomerId(Long customerId) {
        CustomerPipeline pipeline = pipelineRepository.findByCustomerId(customerId).orElse(null);
        if (pipeline == null) {
            return ApiResponse.error("Pipeline not found for customer");
        }
        return ApiResponse.success(convertToDto(pipeline));
    }

    @Override
    public ApiResponse<PipelineDto> updatePipeline(Long customerId, PipelineDto pipelineDto, String updatedBy) {
        Customer customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        CustomerPipeline pipeline = pipelineRepository.findByCustomerId(customerId)
                .orElse(new CustomerPipeline());

        if (pipeline.getId() == null) {
            pipeline.setCustomer(customer);
        }

        // Track changes for workflow history
        StringBuilder changes = new StringBuilder();

        if (pipeline.getSitePhotosUploaded() == null ||
                !pipeline.getSitePhotosUploaded().equals(pipelineDto.getSitePhotosUploaded())) {
            changes.append("Site photos uploaded: ").append(pipelineDto.getSitePhotosUploaded()).append("; ");
        }

        if (pipeline.getRequirementsFulfilled() == null ||
                !pipeline.getRequirementsFulfilled().equals(pipelineDto.getRequirementsFulfilled())) {
            changes.append("Requirements fulfilled: ").append(pipelineDto.getRequirementsFulfilled()).append("; ");
        }

        pipeline.setSiteMeasurements(pipelineDto.getSiteMeasurements());
        pipeline.setSitePhotosUploaded(pipelineDto.getSitePhotosUploaded());
        pipeline.setRequirementsFulfilled(pipelineDto.getRequirementsFulfilled());

        CustomerPipeline savedPipeline = pipelineRepository.save(pipeline);

        // Create workflow history if there were changes
        if (changes.length() > 0) {
            WorkflowHistory history = new WorkflowHistory();
            history.setCustomer(customer);
            history.setPreviousState("Pipeline Update");
            history.setNewState("Pipeline Updated");
            history.setChangedBy(updatedBy);
            history.setChangeReason("Pipeline updated: " + changes.toString());
            history.setTimestamp(LocalDateTime.now());
            workflowHistoryRepository.save(history);
        }

        return ApiResponse.success("Pipeline updated successfully", convertToDto(savedPipeline));
    }

    private PipelineDto convertToDto(CustomerPipeline pipeline) {
        return new PipelineDto(
                pipeline.getId(),
                pipeline.getCustomer().getId(),
                pipeline.getSiteMeasurements(),
                pipeline.getSitePhotosUploaded(),
                pipeline.getRequirementsFulfilled()
        );
    }
}