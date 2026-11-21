package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** The items a save changes. Items not sent stay as they are. */
@Getter
@Setter
@NoArgsConstructor
public class RequirementSheetSaveRequest {

    private List<ItemChange> items;

    /**
     * One item. No key, with a section and a label, adds a custom row; {@code remove} takes a custom
     * row out, or clears a checklist item.
     *
     * <p>A field that is sent is set to what was sent, null included (that clears it); a field left
     * out keeps what is saved. So a screen may send only what changed, or the whole item. The setters
     * note which fields came, which is why this class has no Lombok setters.
     *
     * <p>Quantity comes in as text: a JSON number is read as its digits, exactly, and anything that is
     * not a number is answered with a message instead of failing to read the whole request.
     */
    @NoArgsConstructor
    public static class ItemChange {
        private String key;
        private String section;
        private String label;
        private String status;
        private String choice;
        private String quantity;
        private String note;
        private Boolean remove;
        /** Not a property: no getter or setter, so a request cannot set it. */
        private final Set<String> sent = new HashSet<>();

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getSection() {
            return section;
        }

        public void setSection(String section) {
            this.section = section;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
            sent.add("label");
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
            sent.add("status");
        }

        public String getChoice() {
            return choice;
        }

        public void setChoice(String choice) {
            this.choice = choice;
            sent.add("choice");
        }

        public String getQuantity() {
            return quantity;
        }

        public void setQuantity(String quantity) {
            this.quantity = quantity;
            sent.add("quantity");
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
            sent.add("note");
        }

        public Boolean getRemove() {
            return remove;
        }

        public void setRemove(Boolean remove) {
            this.remove = remove;
        }

        /** Whether the request had this field at all (label, status, choice, quantity or note). */
        boolean has(String field) {
            return sent.contains(field);
        }
    }
}
