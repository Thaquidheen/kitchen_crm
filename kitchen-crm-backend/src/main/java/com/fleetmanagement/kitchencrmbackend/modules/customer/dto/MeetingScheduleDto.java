package com.fleetmanagement.kitchencrmbackend.modules.customer.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingScheduleDto {

    @NotNull(message = "Meeting date and time is required")
    @Future(message = "Meeting must be scheduled for future date")
    private LocalDateTime meetingDateTime;

    private String meetingPurpose;
    private String meetingLocation;
    private String attendees;
}