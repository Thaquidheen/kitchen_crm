package com.fleetmanagement.kitchencrmbackend.modules.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaskReplyCreateDto {
    @NotBlank(message = "Type a reply first")
    @Size(max = 2000, message = "Replies are limited to 2000 characters")
    private String message;
}
