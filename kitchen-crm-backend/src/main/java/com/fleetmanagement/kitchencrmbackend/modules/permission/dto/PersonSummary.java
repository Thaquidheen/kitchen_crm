package com.fleetmanagement.kitchencrmbackend.modules.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One staff member in the picker of the Permissions page. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PersonSummary {
    private Long userId;
    private String name;
    private String email;
    /** ADMIN_STAFF | DESIGNER | SALES | NONE */
    private String staffType;
    private String staffTypeLabel;
    private Boolean active;
    /** How many permissions are set differently for this person and still count for their staff type. */
    private Integer overrides;
}
