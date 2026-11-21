package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * A customer's whole requirement sheet: every checklist item (unmarked when nothing was entered),
 * then the custom rows of each section.
 */
@Getter
@Setter
@NoArgsConstructor
public class RequirementSheetDto {

    private Long customerId;
    private String customerName;
    private List<SectionDto> sections;
    private Counts counts;
    /** The latest change to any item, and who made it; null while nothing was entered. */
    private LocalDateTime updatedAt;
    private String updatedByName;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class SectionDto {
        private String key;
        private String title;
        private String hint;
        private List<ItemDto> items;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ItemDto {
        private String key;
        private String label;
        /** Added by staff for this customer, not one of the checklist's own items. */
        private boolean custom;
        /** Quick choices in groups, one choice per group; empty when the item has none. */
        private List<List<String>> options;
        /** NEEDED, NOT_NEEDED, or null while not marked. */
        private String status;
        /** The chosen options, joined with "," (no space) in the order they are listed. */
        private String choice;
        private BigDecimal quantity;
        private String note;
        private String updatedByName;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Counts {
        private int needed;
        private int notNeeded;
        private int unmarked;
    }
}
