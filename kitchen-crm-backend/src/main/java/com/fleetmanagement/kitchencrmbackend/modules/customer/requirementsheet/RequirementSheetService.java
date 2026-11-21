package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.customer.entity.Customer;
import com.fleetmanagement.kitchencrmbackend.modules.customer.repository.CustomerRepository;
import com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet.RequirementSheetCatalogue.Item;
import com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet.RequirementSheetCatalogue.Section;
import com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet.RequirementSheetDto.Counts;
import com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet.RequirementSheetDto.ItemDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet.RequirementSheetDto.SectionDto;
import com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet.RequirementSheetSaveRequest.ItemChange;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * A customer's requirement sheet: staff mark each checklist item Needed or Not needed (or leave it),
 * pick quick options, and add a quantity and a note; they can add rows of their own to any section.
 * Seeing it is part of the customer's details; the designer given the customer's design reads it
 * from the Designs page (DesignJobController), without changing it.
 *
 * <p>A save checks every item before it writes any, so a refused save changes nothing.
 */
@Service
@Transactional
public class RequirementSheetService {

    public static final String CUSTOMER_NOT_FOUND = "Customer not found";
    public static final String NEEDED = "NEEDED";
    public static final String NOT_NEEDED = "NOT_NEEDED";

    /** More than any real save sends (the whole checklist is about 65 items). */
    private static final int MAX_ITEMS_PER_SAVE = 300;
    /** A sheet stays something a person can read and print. */
    private static final int MAX_CUSTOM_ROWS = 200;
    private static final BigDecimal MAX_QUANTITY = new BigDecimal("99999999");
    private static final int MAX_NOTE = 1000;
    private static final int MAX_LABEL = 255;
    private static final String CHOICE_SEPARATOR = ",";

    @Autowired
    private CustomerRequirementItemRepository repository;
    @Autowired
    private CustomerRepository customerRepository;

    /** Why a save is refused; caught in {@link #save}, before anything was written. */
    private static final class Refused extends RuntimeException {
        Refused(String message) {
            super(message, null, false, false);
        }
    }

    // ------------------------------------------------------------------ read

    @Transactional(readOnly = true)
    public ApiResponse<RequirementSheetDto> get(Long customerId) {
        Customer customer = customerId == null ? null : customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error(CUSTOMER_NOT_FOUND);
        }
        return ApiResponse.success(sheet(customer, repository.findByCustomerIdOrderByIdAsc(customerId)));
    }

    // ------------------------------------------------------------------ save

    /** What one sent item will do, worked out before anything is written. */
    private static final class Planned {
        CustomerRequirementItem row; // the saved row, or null
        String key;
        String section;
        boolean custom;
        boolean delete;
        String label;
        String status;
        String choice;
        BigDecimal quantity;
        String note;
        Integer sortOrder;
    }

    public ApiResponse<RequirementSheetDto> save(Long customerId, RequirementSheetSaveRequest request,
                                                 Long userId, String userName) {
        Customer customer = customerId == null ? null : customerRepository.findById(customerId).orElse(null);
        if (customer == null) {
            return ApiResponse.error(CUSTOMER_NOT_FOUND);
        }
        List<ItemChange> changes = request == null || request.getItems() == null ? List.of() : request.getItems();
        if (changes.size() > MAX_ITEMS_PER_SAVE) {
            return ApiResponse.error("Too many items in one save: at most " + MAX_ITEMS_PER_SAVE);
        }
        List<CustomerRequirementItem> rows = repository.findByCustomerIdOrderByIdAsc(customerId);
        List<Planned> plan;
        try {
            plan = plan(changes, rows);
        } catch (Refused refused) {
            return ApiResponse.error(refused.getMessage());
        }

        LocalDateTime now = LocalDateTime.now();
        List<CustomerRequirementItem> toSave = new ArrayList<>();
        List<CustomerRequirementItem> toDelete = new ArrayList<>();
        for (Planned p : plan) {
            // A checklist item left with nothing in it is the same as never touched: no row.
            boolean empty = !p.custom && p.status == null && p.choice == null && p.quantity == null && p.note == null;
            if (p.delete || empty) {
                if (p.row != null) {
                    toDelete.add(p.row);
                }
                continue;
            }
            CustomerRequirementItem row = p.row;
            if (row != null && sameAs(row, p)) {
                continue; // nothing changed: keep who changed it last
            }
            if (row == null) {
                row = new CustomerRequirementItem();
                row.setCustomerId(customerId);
                row.setItemKey(p.key);
                row.setSectionKey(p.section);
                row.setSortOrder(p.sortOrder);
            }
            row.setLabel(p.custom ? p.label : null);
            row.setStatus(p.status);
            row.setChoice(p.choice);
            row.setQuantity(p.quantity);
            row.setNote(p.note);
            row.setUpdatedByUserId(userId);
            row.setUpdatedByName(userName);
            row.setUpdatedAt(now);
            toSave.add(row);
        }
        repository.deleteAll(toDelete);
        repository.saveAll(toSave);
        repository.flush();
        return ApiResponse.success("Requirement sheet saved",
                sheet(customer, repository.findByCustomerIdOrderByIdAsc(customerId)));
    }

    private List<Planned> plan(List<ItemChange> changes, List<CustomerRequirementItem> rows) {
        Map<String, CustomerRequirementItem> byKey = new HashMap<>();
        Map<String, Integer> lastSort = new HashMap<>();
        int customRows = 0;
        for (CustomerRequirementItem row : rows) {
            byKey.put(row.getItemKey(), row);
            if (RequirementSheetCatalogue.isCustomKey(row.getItemKey())) {
                customRows++;
                if (row.getSortOrder() != null) {
                    lastSort.merge(row.getSectionKey(), row.getSortOrder(), Integer::max);
                }
            }
        }
        Set<String> seen = new HashSet<>();
        List<Planned> plan = new ArrayList<>();
        for (ItemChange change : changes) {
            if (change == null) {
                throw new Refused("An empty item was sent");
            }
            Planned p = new Planned();
            String key = trimToNull(change.getKey());
            boolean remove = Boolean.TRUE.equals(change.getRemove());
            List<List<String>> options;
            String name;
            if (key == null) {
                // A new custom row.
                if (remove) {
                    throw new Refused("Say which item to remove");
                }
                String section = trimToNull(change.getSection());
                if (RequirementSheetCatalogue.section(section) == null) {
                    throw new Refused("Unknown section: " + (section == null ? "none given" : section));
                }
                if (++customRows > MAX_CUSTOM_ROWS) {
                    throw new Refused("A sheet can have at most " + MAX_CUSTOM_ROWS + " items of your own");
                }
                p.key = newCustomKey(byKey.keySet());
                byKey.put(p.key, null); // reserve it for the rest of this save
                p.section = section;
                p.custom = true;
                p.label = label(change.getLabel());
                int sort = lastSort.getOrDefault(section, 0) + 1;
                lastSort.put(section, sort);
                p.sortOrder = sort;
                options = List.of();
                name = p.label;
            } else {
                if (!seen.add(key)) {
                    throw new Refused("The same item was sent twice: " + key);
                }
                p.key = key;
                if (RequirementSheetCatalogue.isCustomKey(key)) {
                    CustomerRequirementItem row = byKey.get(key);
                    if (row == null) {
                        throw new Refused("This item is no longer on the sheet: reload the page (" + key + ")");
                    }
                    p.row = row;
                    p.section = row.getSectionKey(); // a custom row stays in the section it was added to
                    p.custom = true;
                    // A row being removed keeps its name: whatever label came with it does not matter.
                    p.label = !remove && change.has("label") ? label(change.getLabel()) : row.getLabel();
                    options = List.of();
                } else {
                    Item item = RequirementSheetCatalogue.item(key);
                    if (item == null) {
                        throw new Refused("Unknown item: " + key);
                    }
                    p.row = byKey.get(key);
                    p.section = RequirementSheetCatalogue.sectionOf(key);
                    options = item.options();
                }
                name = p.custom ? p.label : RequirementSheetCatalogue.item(key).label();
                if (remove) {
                    // A custom row goes; a checklist item is cleared, which is the same as no row.
                    p.delete = true;
                    plan.add(p);
                    continue;
                }
            }
            CustomerRequirementItem row = p.row;
            p.status = change.has("status") ? status(change.getStatus(), name)
                    : row != null ? row.getStatus() : null;
            p.choice = change.has("choice") ? choice(change.getChoice(), options, name)
                    : row != null ? row.getChoice() : null;
            p.quantity = change.has("quantity") ? quantity(change.getQuantity(), name)
                    : row != null ? row.getQuantity() : null;
            p.note = change.has("note") ? note(change.getNote(), name)
                    : row != null ? row.getNote() : null;
            plan.add(p);
        }
        return plan;
    }

    private static boolean sameAs(CustomerRequirementItem row, Planned p) {
        return Objects.equals(row.getStatus(), p.status)
                && Objects.equals(row.getChoice(), p.choice)
                && (row.getQuantity() == null ? p.quantity == null
                        : p.quantity != null && row.getQuantity().compareTo(p.quantity) == 0)
                && Objects.equals(row.getNote(), p.note)
                && (!p.custom || Objects.equals(row.getLabel(), p.label));
    }

    /** custom. and eight characters, not used yet by this customer. */
    private static String newCustomKey(Set<String> taken) {
        String key;
        do {
            key = RequirementSheetCatalogue.CUSTOM_PREFIX + UUID.randomUUID().toString().substring(0, 8);
        } while (taken.contains(key));
        return key;
    }

    // ------------------------------------------------------------------ checking what was sent

    private static String label(String raw) {
        String label = trimToNull(raw);
        if (label == null) {
            throw new Refused("Give the new item a name");
        }
        if (length(label) > MAX_LABEL) {
            throw new Refused("An item name can be up to " + MAX_LABEL + " characters");
        }
        return label;
    }

    private static String status(String raw, String name) {
        String status = trimToNull(raw);
        if (status == null) {
            return null;
        }
        status = status.toUpperCase(Locale.ROOT);
        if (!NEEDED.equals(status) && !NOT_NEEDED.equals(status)) {
            throw new Refused(name + ": mark it Needed or Not needed, or leave it unmarked");
        }
        return status;
    }

    /**
     * The chosen options, checked against the item's own and put in the order they are listed, so the
     * same choice is always stored the same way. One per group: a burner is 60 cm or 90 cm, not both.
     */
    private static String choice(String raw, List<List<String>> groups, String name) {
        String text = trimToNull(raw);
        if (text == null) {
            return null;
        }
        if (groups.isEmpty()) {
            throw new Refused(name + " has no options to choose from");
        }
        Map<Integer, String> chosenByGroup = new HashMap<>();
        for (String part : text.split(",")) {
            String value = part.trim();
            if (value.isEmpty()) {
                continue;
            }
            String option = null;
            int group = -1;
            for (int g = 0; g < groups.size() && option == null; g++) {
                for (String o : groups.get(g)) {
                    if (o.equalsIgnoreCase(value)) {
                        option = o;
                        group = g;
                        break;
                    }
                }
            }
            if (option == null) {
                throw new Refused(name + ": \"" + value + "\" is not one of its options");
            }
            String before = chosenByGroup.putIfAbsent(group, option);
            if (before != null && !before.equals(option)) {
                throw new Refused(name + ": choose either " + before + " or " + option + ", not both");
            }
        }
        if (chosenByGroup.isEmpty()) {
            return null;
        }
        List<String> ordered = new ArrayList<>();
        for (int g = 0; g < groups.size(); g++) {
            String chosen = chosenByGroup.get(g);
            if (chosen != null) {
                ordered.add(chosen);
            }
        }
        return String.join(CHOICE_SEPARATOR, ordered);
    }

    /** Up to 8 digits before the point and 6 after it; no sign, no exponent. */
    private static final java.util.regex.Pattern PLAIN_QUANTITY =
            java.util.regex.Pattern.compile("\\d{1,8}(\\.\\d{1,6})?|\\.\\d{1,6}");

    private static BigDecimal quantity(String raw, String name) {
        String text = trimToNull(raw);
        if (text == null) {
            return null;
        }
        // Only plain digits reach BigDecimal: "1e999999999" parses, and rounding it would keep the
        // server busy computing a billion-digit power of ten.
        if (!PLAIN_QUANTITY.matcher(text).matches()) {
            throw new Refused(name + ": the quantity must be a number, at most "
                    + MAX_QUANTITY.toPlainString());
        }
        BigDecimal quantity = new BigDecimal(text);
        // Two decimals are kept (DECIMAL(10,2)); rounding first, so the limit is checked on what is stored.
        quantity = quantity.setScale(2, RoundingMode.HALF_UP);
        if (quantity.signum() < 0) {
            throw new Refused(name + ": the quantity cannot be below 0");
        }
        if (quantity.compareTo(MAX_QUANTITY) > 0) {
            throw new Refused(name + ": the quantity can be at most " + MAX_QUANTITY.toPlainString());
        }
        return quantity;
    }

    private static String note(String raw, String name) {
        String note = trimToNull(raw);
        if (note != null && length(note) > MAX_NOTE) {
            throw new Refused(name + ": a note can be up to " + MAX_NOTE + " characters");
        }
        return note;
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Characters as the database counts them (an emoji is one), not UTF-16 units. */
    private static int length(String s) {
        return s.codePointCount(0, s.length());
    }

    // ------------------------------------------------------------------ building the sheet

    private static RequirementSheetDto sheet(Customer customer, List<CustomerRequirementItem> rows) {
        Map<String, CustomerRequirementItem> byKey = new HashMap<>();
        Map<String, List<CustomerRequirementItem>> customBySection = new HashMap<>();
        CustomerRequirementItem latest = null;
        for (CustomerRequirementItem row : rows) {
            if (RequirementSheetCatalogue.isCustomKey(row.getItemKey())) {
                customBySection.computeIfAbsent(row.getSectionKey(), k -> new ArrayList<>()).add(row);
            } else {
                byKey.put(row.getItemKey(), row);
            }
            if (latest == null || (row.getUpdatedAt() != null && row.getUpdatedAt().isAfter(latest.getUpdatedAt()))) {
                latest = row;
            }
        }
        Comparator<CustomerRequirementItem> customOrder = Comparator
                .comparing(CustomerRequirementItem::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CustomerRequirementItem::getId);

        Counts counts = new Counts();
        List<SectionDto> sections = new ArrayList<>();
        for (Section section : RequirementSheetCatalogue.SECTIONS) {
            List<ItemDto> items = new ArrayList<>();
            for (Item item : section.items()) {
                items.add(item(item.key(), item.label(), false, item.options(), byKey.get(item.key()), counts));
            }
            List<CustomerRequirementItem> custom = customBySection.getOrDefault(section.key(), List.of());
            custom.stream().sorted(customOrder)
                    .forEach(row -> items.add(item(row.getItemKey(), row.getLabel(), true, List.of(), row, counts)));
            SectionDto dto = new SectionDto();
            dto.setKey(section.key());
            dto.setTitle(section.title());
            dto.setHint(section.hint());
            dto.setItems(items);
            sections.add(dto);
        }

        RequirementSheetDto dto = new RequirementSheetDto();
        dto.setCustomerId(customer.getId());
        dto.setCustomerName(customer.getName());
        dto.setSections(sections);
        dto.setCounts(counts);
        if (latest != null) {
            dto.setUpdatedAt(latest.getUpdatedAt());
            dto.setUpdatedByName(latest.getUpdatedByName());
        }
        return dto;
    }

    private static ItemDto item(String key, String label, boolean custom, List<List<String>> options,
                                CustomerRequirementItem row, Counts counts) {
        ItemDto dto = new ItemDto();
        dto.setKey(key);
        dto.setLabel(label);
        dto.setCustom(custom);
        dto.setOptions(options);
        if (row != null) {
            dto.setStatus(row.getStatus());
            dto.setChoice(row.getChoice());
            dto.setQuantity(row.getQuantity());
            dto.setNote(row.getNote());
            dto.setUpdatedByName(row.getUpdatedByName());
            dto.setUpdatedAt(row.getUpdatedAt());
        }
        if (NEEDED.equals(dto.getStatus())) {
            counts.setNeeded(counts.getNeeded() + 1);
        } else if (NOT_NEEDED.equals(dto.getStatus())) {
            counts.setNotNeeded(counts.getNotNeeded() + 1);
        } else {
            counts.setUnmarked(counts.getUnmarked() + 1);
        }
        return dto;
    }
}
