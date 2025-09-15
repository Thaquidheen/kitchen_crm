package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.*;
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
        return new CustomerDto(
                customer.getId(),
                customer.getName(),
                customer.getContact(),
                customer.getEmail(),
                customer.getAddress(),
                customer.getKitchenTypes(),
                customer.getStatus(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
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