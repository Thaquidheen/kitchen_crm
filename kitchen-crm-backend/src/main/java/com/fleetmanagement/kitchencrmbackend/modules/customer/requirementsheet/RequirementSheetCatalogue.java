package com.fleetmanagement.kitchencrmbackend.modules.customer.requirementsheet;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The items of the requirement sheet, from the company's paper checklist, in the order the sheet
 * shows them. The screens only show what this sends, so an item is added or renamed here alone.
 *
 * <p>Item keys are stored with every customer's answers: never change or reuse one. A label can
 * change freely. An item taken out later keeps its saved rows; they are just not shown any more.
 *
 * <p>Options are quick choices, in groups: one choice per group. An item with two sides to it (a
 * burner's size and whether it is built in) has two groups; most have one or none.
 */
public final class RequirementSheetCatalogue {

    public record Item(String key, String label, List<List<String>> options) {
    }

    public record Section(String key, String title, String hint, List<Item> items) {
    }

    /** The prefix of the keys of rows staff add themselves. Never used by a checklist item. */
    public static final String CUSTOM_PREFIX = "custom.";

    private static final List<String> SIZES = List.of("30 cm", "60 cm", "90 cm");
    private static final List<String> FITTING = List.of("Built-in", "Freestanding");

    public static final List<Section> SECTIONS = List.of(
            section("material", "Cabinet / Unit Material", null,
                    item("material.ss", "Stainless Steel (SS)"),
                    item("material.boilo", "Boilo board")),
            section("units", "Kitchen Units", null,
                    item("units.sink", "Sink Unit"),
                    item("units.hob", "Hob Unit"),
                    item("units.tall", "Tall Units"),
                    item("units.crockery", "Crockery Units"),
                    item("units.open", "Open Units"),
                    item("units.loft", "Loft"),
                    item("units.loft_frame", "Loft Frame Structure")),
            section("accessories", "Accessories", null,
                    item("accessories.tall_shutter", "Tall Shutter"),
                    item("accessories.pantry_units", "Pantry Units"),
                    item("accessories.pantry_pullout", "Pantry Pullout"),
                    item("accessories.space_tower", "Space Tower"),
                    item("accessories.ladder_pullout", "Ladder Pullout"),
                    item("accessories.towel_pullout", "Towel Pullout"),
                    item("accessories.bottle_pullout", "Bottle Pullout"),
                    item("accessories.drawers", "Drawers"),
                    item("accessories.normal_shutters", "Normal Shutters"),
                    item("accessories.gtpt", "GTPT"),
                    item("accessories.pullout_waste_bin", "Pullout Waste Bin"),
                    item("accessories.round_waste_bin", "Round Waste Bin"),
                    item("accessories.cutlery_unit", "Cutlery Unit"),
                    item("accessories.canister_set", "Canister Set"),
                    item("accessories.bi_fold", "Bi-Fold"),
                    item("accessories.lift_up", "Lift-Up"),
                    item("accessories.detergent_holder", "Detergent Holder"),
                    item("accessories.detergent_pullout", "Detergent Pullout"),
                    item("accessories.magic_corner", "Magic Corner"),
                    item("accessories.pulldown_gtpt", "Pulldown GTPT"),
                    item("accessories.imove_pulldown", "iMove Pulldown")),
            section("sink", "Sink Type", null,
                    item("sink.single", "Single Bowl"),
                    item("sink.single_drain", "Single Bowl with Drain Board"),
                    item("sink.double", "Double Bowl"),
                    item("sink.double_drain", "Double Bowl with Drain Board"),
                    item("sink.countertop_gtpt", "Countertop GTPT")),
            section("appliances", "Appliances", null,
                    item("appliances.hood", "Hood", List.of("Flat", "Inclined", "Ceiling", "Downdraft")),
                    item("appliances.burner", "Burner", SIZES, FITTING),
                    item("appliances.induction", "Induction", SIZES, FITTING),
                    item("appliances.fridge", "Fridge", List.of("Side-by-Side", "Single Door", "Built-in")),
                    item("appliances.washing_machine", "Washing Machine"),
                    item("appliances.oven", "Oven", FITTING),
                    item("appliances.microwave", "Microwave", FITTING),
                    item("appliances.dishwasher", "Dishwasher", FITTING),
                    item("appliances.purifier", "Purifier", List.of("Countertop", "Bottom Counter"))),
            section("design", "Design", null,
                    item("design.type", "Design Type", List.of("Modern", "Classic"))),
            section("door_material", "Door Material", null,
                    item("door_material.boilo", "Boilo Board"),
                    item("door_material.aluminium_glass", "Aluminium frame with Glass")),
            section("door_finish", "Door Finish", null,
                    item("door_finish.acrylic_15", "Acrylic 1.5 mm"),
                    item("door_finish.laminate", "Laminate"),
                    item("door_finish.luvih", "Luvih"),
                    item("door_finish.acrylic_2", "Acrylic 2 mm"),
                    item("door_finish.acrylic_3", "Acrylic 3 mm"),
                    item("door_finish.pu", "PU"),
                    item("door_finish.framed_laminate", "Framed Shutter with Laminate"),
                    item("door_finish.lacquered_glass", "Lacquered Glass"),
                    item("door_finish.black_glass", "Black Painted Glass"),
                    item("door_finish.ceramic", "Ceramic")),
            section("surface", "Surface Finish", null,
                    item("surface.matt", "Matt"),
                    item("surface.glossy", "Glossy")),
            // Nothing fixed here: whatever else the client asked for is added as custom rows.
            section("special", "Special Requirements", "Anything else the client asked for"));

    private static final Map<String, Section> SECTION_BY_KEY = new LinkedHashMap<>();
    private static final Map<String, Item> ITEM_BY_KEY = new LinkedHashMap<>();
    private static final Map<String, String> SECTION_OF_ITEM = new LinkedHashMap<>();

    static {
        for (Section s : SECTIONS) {
            SECTION_BY_KEY.put(s.key(), s);
            for (Item i : s.items()) {
                if (ITEM_BY_KEY.put(i.key(), i) != null || i.key().startsWith(CUSTOM_PREFIX)) {
                    // A key used twice would make two items share one saved answer.
                    throw new IllegalStateException("Requirement sheet item key used twice or reserved: " + i.key());
                }
                SECTION_OF_ITEM.put(i.key(), s.key());
            }
        }
    }

    private RequirementSheetCatalogue() {
    }

    /** The section with this key, or null. */
    public static Section section(String key) {
        return key == null ? null : SECTION_BY_KEY.get(key);
    }

    /** The checklist item with this key, or null (a custom row is never one). */
    public static Item item(String key) {
        return key == null ? null : ITEM_BY_KEY.get(key);
    }

    /** The section of a checklist item, or null. */
    public static String sectionOf(String itemKey) {
        return itemKey == null ? null : SECTION_OF_ITEM.get(itemKey);
    }

    public static boolean isCustomKey(String key) {
        return key != null && key.startsWith(CUSTOM_PREFIX);
    }

    private static Section section(String key, String title, String hint, Item... items) {
        return new Section(key, title, hint, List.of(items));
    }

    @SafeVarargs
    private static Item item(String key, String label, List<String>... groups) {
        return new Item(key, label, Arrays.stream(groups).map(List::copyOf).toList());
    }
}
