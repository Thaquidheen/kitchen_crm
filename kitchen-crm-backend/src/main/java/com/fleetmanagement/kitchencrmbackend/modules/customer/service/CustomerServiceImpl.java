package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import com.fleetmanagement.kitchencrmbackend.modules.customer.dto.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.*;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.*;
import com.fleetmanagement.kitchencrmbackend.modules.architect.repository.ArchitectRepository;
import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
    public ApiResponse<Page<CustomerDto>> getAllCustomers(String search, String name, String email,
                                                          Customer.CustomerStatus status,
                                                          Customer.LeadSourceType leadSourceType,
                                                          String address, String kitchenTypes,
                                                          LocalDateTime createdFrom, LocalDateTime createdTo,
                                                          Pageable pageable) {
        Specification<Customer> spec = CustomerSpecifications.withFilters(
                search, name, email, status, leadSourceType, address, kitchenTypes, createdFrom, createdTo);
        Page<Customer> customers = customerRepository.findAll(spec, pageable);
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

        // Handle lead source + referrer details
        applyLeadSource(customer,
                customerCreateDto.getLeadSourceType(),
                customerCreateDto.getArchitectId(),
                customerCreateDto.getReferralName(), customerCreateDto.getReferralContact(),
                customerCreateDto.getReferralLocation(), customerCreateDto.getReferralDesignation(),
                customerCreateDto.getReferralFirm(), customerCreateDto.getReferralEmail(),
                customerCreateDto.getManualLeadName(), customerCreateDto.getManualLeadContact());

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
        existingCustomer.setSqft(customerDto.getSqft());
        existingCustomer.setPlace(customerDto.getPlace());
        existingCustomer.setContactPerson(customerDto.getContactPerson());
        existingCustomer.setFollowUpNotes(customerDto.getFollowUpNotes());

        // Handle lead source + referrer details. Only touch lead source if the payload
        // actually specifies it, so partial updates don't wipe an existing source.
        boolean leadSourceProvided = customerDto.getLeadSourceType() != null
                || customerDto.getArchitectId() != null
                || StringUtils.hasText(customerDto.getManualLeadName())
                || StringUtils.hasText(customerDto.getReferralName());
        if (leadSourceProvided) {
            applyLeadSource(existingCustomer,
                    customerDto.getLeadSourceType(),
                    customerDto.getArchitectId(),
                    customerDto.getReferralName(), customerDto.getReferralContact(),
                    customerDto.getReferralLocation(), customerDto.getReferralDesignation(),
                    customerDto.getReferralFirm(), customerDto.getReferralEmail(),
                    customerDto.getManualLeadName(), customerDto.getManualLeadContact());
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
        dto.setSqft(customer.getSqft());
        dto.setPlace(customer.getPlace());
        dto.setContactPerson(customer.getContactPerson());
        dto.setFollowUpNotes(customer.getFollowUpNotes());
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
        dto.setReferralName(customer.getReferralName());
        dto.setReferralContact(customer.getReferralContact());
        dto.setReferralLocation(customer.getReferralLocation());
        dto.setReferralDesignation(customer.getReferralDesignation());
        dto.setReferralFirm(customer.getReferralFirm());
        dto.setReferralEmail(customer.getReferralEmail());

        return dto;
    }

    /**
     * Applies the chosen lead source to the customer, populating only the fields
     * relevant to that source and clearing the rest. If {@code type} is null it is
     * inferred for backward compatibility with older clients.
     */
    private void applyLeadSource(Customer customer,
                                 Customer.LeadSourceType type,
                                 Long architectId,
                                 String referralName, String referralContact,
                                 String referralLocation, String referralDesignation,
                                 String referralFirm, String referralEmail,
                                 String manualLeadName, String manualLeadContact) {
        if (type == null) {
            if (architectId != null) {
                type = Customer.LeadSourceType.ARCHITECT;
            } else if (StringUtils.hasText(manualLeadName)) {
                type = Customer.LeadSourceType.MANUAL_REFERRAL;
                // Carry legacy manual fields into the new referral fields.
                if (referralName == null) referralName = manualLeadName;
                if (referralContact == null) referralContact = manualLeadContact;
            } else {
                type = Customer.LeadSourceType.NONE;
            }
        }

        // Reset all source-specific fields, then set only those relevant to the type.
        customer.setArchitect(null);
        customer.setManualLeadName(null);
        customer.setManualLeadContact(null);
        customer.setReferralName(null);
        customer.setReferralContact(null);
        customer.setReferralLocation(null);
        customer.setReferralDesignation(null);
        customer.setReferralFirm(null);
        customer.setReferralEmail(null);

        switch (type) {
            case ARCHITECT -> {
                // Architect can be linked from the Architects module and/or described free-text
                // via the source-details panel (name/firm/phone/email/location).
                if (architectId != null) {
                    architectRepository.findById(architectId).ifPresent(customer::setArchitect);
                }
                customer.setReferralName(referralName);
                customer.setReferralContact(referralContact);
                customer.setReferralLocation(referralLocation);
                customer.setReferralDesignation(referralDesignation);
                customer.setReferralFirm(referralFirm);
                customer.setReferralEmail(referralEmail);
            }
            case BUILDER_REFERRAL, MANUAL_REFERRAL, CONSULTED -> {
                customer.setReferralName(referralName);
                customer.setReferralContact(referralContact);
                customer.setReferralLocation(referralLocation);
                customer.setReferralDesignation(referralDesignation);
                customer.setReferralFirm(referralFirm);
                customer.setReferralEmail(referralEmail);
            }
            case MANUAL -> {
                // Legacy "Enter Lead Manually"
                customer.setManualLeadName(manualLeadName);
                customer.setManualLeadContact(manualLeadContact);
            }
            default -> {
                // NONE, ONLINE, WALK_IN, SCOUTING: no extra fields
            }
        }

        customer.setLeadSourceType(type);
    }

    private Customer convertToEntity(CustomerCreateDto dto) {
        Customer customer = new Customer();
        customer.setName(dto.getName());
        customer.setContact(dto.getContact());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        customer.setKitchenTypes(dto.getKitchenTypes());
        customer.setSqft(dto.getSqft());
        customer.setPlace(dto.getPlace());
        customer.setContactPerson(dto.getContactPerson());
        customer.setFollowUpNotes(dto.getFollowUpNotes());
        customer.setStatus(dto.getStatus() != null ? dto.getStatus() : Customer.CustomerStatus.LEAD);
        return customer;
    }
}