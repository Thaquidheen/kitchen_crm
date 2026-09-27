package com.fleetmanagement.kitchencrmbackend.modules.lasermeter;

import com.fleetmanagement.kitchencrmbackend.modules.lasermeter.service.LaserMeterAdapterValidator;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LaserMeterAdapterValidatorTest {

    private static Map<String, Object> validConfig() {
        Map<String, Object> parser = new HashMap<>(Map.of(
                "type", "binary", "offset", 1, "length", 4, "format", "uint32",
                "littleEndian", true, "sourceUnit", "mm", "scale", 1));
        Map<String, Object> cfg = new HashMap<>();
        cfg.put("bleFilters", List.of(Map.of("namePrefix", "ACME")));
        cfg.put("serviceUuid", "fff0");
        cfg.put("measurementCharUuid", "0000fff1-0000-1000-8000-00805f9b34fb");
        cfg.put("triggerCharUuid", "0xFFF2");
        cfg.put("triggerPayloadHex", "aa 01");
        cfg.put("optionalServices", List.of("battery_service"));
        cfg.put("parser", parser);
        cfg.put("minMm", 50);
        cfg.put("maxMm", 15000);
        return cfg;
    }

    private static String errors(String key, Map<String, Object> cfg) {
        return String.join("\n", LaserMeterAdapterValidator.validate(key, "Acme", cfg));
    }

    @Test
    void acceptsAValidBinaryConfig() {
        assertEquals("", errors("acme-x1", validConfig()));
    }

    @Test
    void acceptsAValidAsciiConfig() {
        Map<String, Object> cfg = validConfig();
        cfg.put("parser", Map.of("type", "ascii", "regex", "D=(?<value>\\d+(?:[.,]\\d+)?)\\s*(?<unit>mm|m)?",
                "sourceUnit", "m", "scale", 1));
        assertEquals("", errors("acme-x1", cfg));
    }

    @Test
    void rejectsBadAndReservedKeys() {
        assertTrue(errors("Bad Key", validConfig()).contains("ID must be"));
        assertTrue(errors("generic", validConfig()).contains("reserved"));
    }

    @Test
    void rejectsMalformedUuidsHexAndFilters() {
        Map<String, Object> cfg = validConfig();
        cfg.put("serviceUuid", "not a uuid!");
        cfg.put("triggerPayloadHex", "abc");
        cfg.put("bleFilters", List.of(Map.of()));
        String e = errors("acme-x1", cfg);
        assertTrue(e.contains("Service UUID"));
        assertTrue(e.contains("Trigger payload"));
        assertTrue(e.contains("filter needs"));
    }

    @Test
    void rejectsBadRangeAndParser() {
        Map<String, Object> cfg = validConfig();
        cfg.put("minMm", 100);
        cfg.put("maxMm", 50.5);
        cfg.put("parser", Map.of("type", "binary", "offset", -1, "format", "uint64", "sourceUnit", "yd", "scale", 0));
        String e = errors("acme-x1", cfg);
        assertTrue(e.contains("Range"));
        assertTrue(e.contains("offset"));
        assertTrue(e.contains("Binary format"));
        assertTrue(e.contains("source unit"));
        assertTrue(e.contains("scale"));
        assertTrue(e.contains("littleEndian"));
    }

    @Test
    void rejectsLengthMismatchAndBadRegex() {
        Map<String, Object> cfg = validConfig();
        @SuppressWarnings("unchecked")
        Map<String, Object> parser = (Map<String, Object>) cfg.get("parser");
        parser.put("length", 2);
        assertTrue(errors("acme-x1", cfg).contains("length must be 4"));
        cfg.put("parser", Map.of("type", "ascii", "regex", "(", "sourceUnit", "m", "scale", 1));
        assertTrue(errors("acme-x1", cfg).contains("does not compile"));
    }
}
