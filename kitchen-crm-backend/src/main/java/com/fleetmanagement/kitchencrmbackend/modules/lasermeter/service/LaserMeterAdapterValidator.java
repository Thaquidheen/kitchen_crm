package com.fleetmanagement.kitchencrmbackend.modules.lasermeter.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Validates adapter config JSON. Mirrors adapterValidation.ts in the frontend, which gives the
 * admin instant feedback; this is the authoritative copy. Pure and stateless.
 */
public final class LaserMeterAdapterValidator {

    public static final Pattern KEY_PATTERN = Pattern.compile("^[a-z0-9][a-z0-9_-]{1,63}$");
    public static final Set<String> RESERVED_KEYS = Set.of("generic", "mock");

    private static final Set<String> UNITS = Set.of("mm", "cm", "m", "in", "ft");
    private static final Map<String, Integer> FORMAT_SIZE = Map.of(
            "uint16", 2, "uint32", 4, "int32", 4, "float32", 4);
    private static final Pattern FULL_UUID = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    private static final Pattern SHORT_UUID = Pattern.compile("^(0x)?([0-9a-f]{4}|[0-9a-f]{8})$");
    private static final Pattern GATT_NAME = Pattern.compile("^[a-z][a-z0-9_.]*$");
    private static final Pattern HEX = Pattern.compile("^[0-9a-fA-F]*$");

    private LaserMeterAdapterValidator() {
    }

    public static List<String> validate(String adapterKey, String displayName, Map<String, Object> config) {
        List<String> errors = new ArrayList<>();
        if (adapterKey == null || !KEY_PATTERN.matcher(adapterKey).matches()) {
            errors.add("ID must be 2–64 characters: lowercase letters, digits, \"-\" or \"_\"");
        } else if (RESERVED_KEYS.contains(adapterKey)) {
            errors.add("\"" + adapterKey + "\" is reserved for a built-in adapter");
        }
        if (displayName == null || displayName.isBlank()) {
            errors.add("Display name is required");
        }
        if (config == null) {
            errors.add("Config is required");
            return errors;
        }

        if (!isUuidLike(config.get("serviceUuid"))) {
            errors.add("Service UUID is missing or malformed");
        }
        if (!isUuidLike(config.get("measurementCharUuid"))) {
            errors.add("Measurement characteristic UUID is missing or malformed");
        }
        Object trigger = config.get("triggerCharUuid");
        if (notBlank(trigger) && !isUuidLike(trigger)) {
            errors.add("Trigger characteristic UUID is malformed");
        }
        Object payload = config.get("triggerPayloadHex");
        if (notBlank(payload)) {
            if (!isHex(payload.toString())) {
                errors.add("Trigger payload must be hex bytes, e.g. \"01\" or \"aa 55 01\"");
            }
            if (!notBlank(trigger)) {
                errors.add("Trigger payload needs a trigger characteristic");
            }
        }

        Object filters = config.get("bleFilters");
        if (filters != null && !(filters instanceof Collection)) {
            errors.add("bleFilters must be a list");
        } else if (filters != null) {
            for (Object f : (Collection<?>) filters) {
                if (!(f instanceof Map<?, ?> fm)) {
                    errors.add("Each Bluetooth filter must be an object");
                    continue;
                }
                Object prefix = fm.get("namePrefix");
                Object services = fm.get("services");
                boolean hasServices = services instanceof Collection<?> c && !c.isEmpty();
                if (!notBlank(prefix) && !hasServices) {
                    errors.add("Each Bluetooth filter needs a name prefix or at least one service");
                }
                if (hasServices) {
                    for (Object s : (Collection<?>) services) {
                        if (!isUuidLike(s)) {
                            errors.add("Filter service \"" + s + "\" is not a valid UUID");
                        }
                    }
                }
            }
        }
        Object optional = config.get("optionalServices");
        if (optional instanceof Collection<?> c) {
            for (Object s : c) {
                if (!isUuidLike(s)) {
                    errors.add("Optional service \"" + s + "\" is not a valid UUID");
                }
            }
        }

        Integer minMm = asInt(config.get("minMm"));
        Integer maxMm = asInt(config.get("maxMm"));
        if (minMm == null || maxMm == null || minMm < 0 || maxMm <= minMm) {
            errors.add("Range must be whole millimetres with 0 ≤ min < max");
        }

        Object parserObj = config.get("parser");
        if (!(parserObj instanceof Map<?, ?> parser)) {
            errors.add("Parser is required");
            return errors;
        }
        if (!UNITS.contains(String.valueOf(parser.get("sourceUnit")))) {
            errors.add("Parser source unit must be one of mm, cm, m, in, ft");
        }
        Object scale = parser.get("scale");
        if (!(scale instanceof Number n) || !Double.isFinite(n.doubleValue()) || n.doubleValue() == 0) {
            errors.add("Parser scale must be a non-zero number");
        }
        String type = String.valueOf(parser.get("type"));
        if ("binary".equals(type)) {
            String format = String.valueOf(parser.get("format"));
            Integer size = FORMAT_SIZE.get(format);
            if (size == null) {
                errors.add("Binary format must be uint16, uint32, int32 or float32");
            }
            Integer offset = asInt(parser.get("offset"));
            if (offset == null || offset < 0) {
                errors.add("Binary offset must be a whole number ≥ 0");
            }
            Object length = parser.get("length");
            if (length != null && size != null && !size.equals(asInt(length))) {
                errors.add("Binary length must be " + size + " for " + format);
            }
            if (!(parser.get("littleEndian") instanceof Boolean)) {
                errors.add("Binary byte order (littleEndian) is required");
            }
        } else if ("ascii".equals(type)) {
            Object regex = parser.get("regex");
            if (!notBlank(regex)) {
                errors.add("ASCII parser needs a regex");
            } else {
                try {
                    Pattern.compile(regex.toString());
                } catch (PatternSyntaxException e) {
                    errors.add("ASCII parser regex does not compile");
                }
            }
        } else {
            errors.add("Parser type must be \"binary\" or \"ascii\"");
        }
        return errors;
    }

    static boolean isUuidLike(Object value) {
        if (!notBlank(value)) {
            return false;
        }
        String u = value.toString().trim().toLowerCase();
        return FULL_UUID.matcher(u).matches() || SHORT_UUID.matcher(u).matches() || GATT_NAME.matcher(u).matches();
    }

    static boolean isHex(String hex) {
        String clean = hex.replaceAll("(?i)0x", "").replaceAll("[\\s:,-]", "");
        return clean.length() % 2 == 0 && HEX.matcher(clean).matches();
    }

    private static boolean notBlank(Object o) {
        return o != null && !o.toString().isBlank();
    }

    /** Whole numbers only: 50 and 50.0 are fine, 50.5 or "50" are not. */
    private static Integer asInt(Object o) {
        if (o instanceof Number n && n.doubleValue() == Math.rint(n.doubleValue())) {
            return n.intValue();
        }
        return null;
    }
}
