package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerPipelineRepository pipelineRepository;

    @Autowired
    private WorkflowHistoryRepository workflowHistoryRepository;

    @Autowired
    private ArchitectRepository architectRepository;

    @Override
    public ApiResponse<Page<CustomerDto>> getAllCustomers(String name, String email,
                                                          Customer.CustomerStatus status, Pageable pageable) {
        Page<Customer> customers = customerRepository.findByFilters(name, email, status, pageable);
        Page<CustomerDto> customerDtos = customers.map(this::convertToDto);
        return ApiResponse.success(customerDtos);
    }

    @Override
    public ApiResponse<CustomerDto> getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }
        return ApiResponse.success(convertToDto(customer));
    }

    @Override
    public ApiResponse<CustomerDto> createCustomer(CustomerCreateDto customerCreateDto, String createdBy) {
        if (customerCreateDto.getEmail() != null &&
                customerRepository.existsByEmail(customerCreateDto.getEmail())) {
            return ApiResponse.error("Email already exists");
        }

        Customer customer = convertToEntity(customerCreateDto);
        
        // Handle lead tracking
        if (customerCreateDto.getArchitectId() != null) {
            architectRepository.findById(customerCreateDto.getArchitectId()).ifPresent(architect -> {
                customer.setArchitect(architect);
                customer.setLeadSourceType(Customer.LeadSourceType.ARCHITECT);
                customer.setManualLeadName(null);
                customer.setManualLeadContact(null);
            });
        } else if (customerCreateDto.getManualLeadName() != null && !customerCreateDto.getManualLeadName().trim().isEmpty()) {
            customer.setLeadSourceType(Customer.LeadSourceType.MANUAL);
            customer.setManualLeadName(customerCreateDto.getManualLeadName());
            customer.setManualLeadContact(customerCreateDto.getManualLeadContact());
            customer.setArchitect(null);
        } else {
            customer.setLeadSourceType(Customer.LeadSourceType.NONE);
        }
        
        Customer savedCustomer = customerRepository.save(customer);

        // Create initial pipeline entry
        CustomerPipeline pipeline = new CustomerPipeline();
        pipeline.setCustomer(savedCustomer);
        pipelineRepository.save(pipeline);

        // Create workflow history entry
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(savedCustomer);
        history.setPreviousState(null);
        history.setNewState(savedCustomer.getStatus().name());
        history.setChangedBy(createdBy);
        history.setChangeReason("Customer created");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);

        return ApiResponse.success("Customer created successfully", convertToDto(savedCustomer));
    }

    @Override
    public ApiResponse<CustomerDto> updateCustomer(Long id, CustomerDto customerDto, String updatedBy) {
        Customer existingCustomer = customerRepository.findById(id).orElse(null);
        if (existingCustomer == null) {
            return ApiResponse.error("Customer not found");
        }

        // Check email uniqueness
        if (customerDto.getEmail() != null &&
                !existingCustomer.getEmail().equals(customerDto.getEmail()) &&
                customerRepository.existsByEmail(customerDto.getEmail())) {
            return ApiResponse.error("Email already exists");
        }

        existingCustomer.setName(customerDto.getName());
        existingCustomer.setContact(customerDto.getContact());
        existingCustomer.setEmail(customerDto.getEmail());
        existingCustomer.setAddress(customerDto.getAddress());
        existingCustomer.setKitchenTypes(customerDto.getKitchenTypes());

        // Handle lead tracking updates
        if (customerDto.getArchitectId() != null) {
            architectRepository.findById(customerDto.getArchitectId()).ifPresent(architect -> {
                existingCustomer.setArchitect(architect);
                existingCustomer.setLeadSourceType(Customer.LeadSourceType.ARCHITECT);
                existingCustomer.setManualLeadName(null);
                existingCustomer.setManualLeadContact(null);
            });
        } else if (customerDto.getManualLeadName() != null && !customerDto.getManualLeadName().trim().isEmpty()) {
            existingCustomer.setLeadSourceType(Customer.LeadSourceType.MANUAL);
            existingCustomer.setManualLeadName(customerDto.getManualLeadName());
            existingCustomer.setManualLeadContact(customerDto.getManualLeadContact());
            existingCustomer.setArchitect(null);
        } else if (customerDto.getLeadSourceType() != null) {
            existingCustomer.setLeadSourceType(customerDto.getLeadSourceType());
            if (customerDto.getLeadSourceType() == Customer.LeadSourceType.NONE) {
                existingCustomer.setArchitect(null);
                existingCustomer.setManualLeadName(null);
                existingCustomer.setManualLeadContact(null);
            }
        }

        Customer updatedCustomer = customerRepository.save(existingCustomer);

        // Create workflow history entry
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(updatedCustomer);
        history.setPreviousState("Customer Update");
        history.setNewState("Customer Updated");
        history.setChangedBy(updatedBy);
        history.setChangeReason("Customer information updated");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);

        return ApiResponse.success("Customer updated successfully", convertToDto(updatedCustomer));
    }

    @Override
    public ApiResponse<String> deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        customerRepository.delete(customer);
        return ApiResponse.success("Customer deleted successfully");
    }

    @Override
    public ApiResponse<String> updateCustomerStatus(Long id, Customer.CustomerStatus newStatus,
                                                    String changedBy, String reason) {
        Customer customer = customerRepository.findById(id).orElse(null);
        if (customer == null) {
            return ApiResponse.error("Customer not found");
        }

        String previousStatus = customer.getStatus().name();
        customer.setStatus(newStatus);
        customerRepository.save(customer);

        // Create workflow history entry
        WorkflowHistory history = new WorkflowHistory();
        history.setCustomer(customer);
        history.setPreviousState(previousStatus);
        history.setNewState(newStatus.name());
        history.setChangedBy(changedBy);
        history.setChangeReason(reason != null ? reason : "Status updated");
        history.setTimestamp(LocalDateTime.now());
        workflowHistoryRepository.save(history);

        return ApiResponse.success("Customer status updated successfully");
    }

    @Override
    public ApiResponse<Map<String, Long>> getCustomerStatistics() {
        Map<String, Long> stats = new HashMap<>();

        for (Customer.CustomerStatus status : Customer.CustomerStatus.values()) {
            Long count = customerRepository.countByStatus(status);
            stats.put(status.name().toLowerCase(), count);
        }

        stats.put("total", customerRepository.count());

        return ApiResponse.success(stats);
    }

    private CustomerDto convertToDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setContact(customer.getContact());
        dto.setEmail(customer.getEmail());
        dto.setAddress(customer.getAddress());
        dto.setKitchenTypes(customer.getKitchenTypes());
        dto.setStatus(customer.getStatus());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setUpdatedAt(customer.getUpdatedAt());
        
        // Lead tracking fields
        if (customer.getArchitect() != null) {
            dto.setArchitectId(customer.getArchitect().getId());
            dto.setArchitectName(customer.getArchitect().getArchitectureName());
        }
        dto.setLeadSourceType(customer.getLeadSourceType());
        dto.setManualLeadName(customer.getManualLeadName());
        dto.setManualLeadContact(customer.getManualLeadContact());
        
        return dto;
    }

    private Customer convertToEntity(CustomerCreateDto dto) {
        Customer customer = new Customer();
        customer.setName(dto.getName());
        customer.setContact(dto.getContact());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        customer.setKitchenTypes(dto.getKitchenTypes());
        customer.setStatus(Customer.CustomerStatus.LEAD);
        return customer;
    }
}