package com.fleetmanagement.kitchencrmbackend.modules.quotation.margincode;

import com.fleetmanagement.kitchencrmbackend.common.dto.ApiResponse;
import com.fleetmanagement.kitchencrmbackend.modules.settings.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Margin codes: the administrator names margin percentages (R = 45%). Staff allowed to see margins
 * get the codes, never the percentages; a code they choose is turned into its percentage here,
 * on the server. One code per percentage and one percentage per code.
 */
@Service
@Transactional
public class MarginCodeService {

    private static final Pattern CODE = Pattern.compile("[A-Za-z0-9-]{1,12}");
    private static final BigDecimal MAX = BigDecimal.valueOf(500);

    /** The margin categories of a quotation, as the settings and the quotation fields name them. */
    public static final List<String> CATEGORIES = List.of("accessories", "cabinets", "doors", "lighting", "miscellaneous");

    @Autowired
    private MarginCodeRepository repository;
    @Autowired
    private SystemSettingService systemSettingService;

    private static BigDecimal norm(BigDecimal p) {
        return p == null ? null : p.setScale(2, RoundingMode.HALF_UP);
    }

    // ------------------------------------------------------------------ the administrator's list

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (MarginCode c : repository.findAllByOrderByPercentageAsc()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", c.getId());
            row.put("code", c.getCode());
            row.put("percentage", c.getPercentage());
            row.put("active", Boolean.TRUE.equals(c.getActive()));
            row.put("note", c.getNote());
            out.add(row);
        }
        return out;
    }

    public ApiResponse<Map<String, Object>> save(Long id, String code, BigDecimal percentage, Boolean active, String note) {
        MarginCode row = id == null ? new MarginCode() : repository.findById(id).orElse(null);
        if (row == null) {
            return ApiResponse.error("Margin code not found");
        }
        String c = code == null ? "" : code.trim();
        if (!CODE.matcher(c).matches()) {
            return ApiResponse.error("A code is 1 to 12 letters, digits or dashes, for example R or K2");
        }
        BigDecimal p = norm(percentage);
        if (p == null || p.signum() < 0 || p.compareTo(MAX) > 0) {
            return ApiResponse.error("The percentage must be between 0 and 500");
        }
        for (MarginCode other : repository.findAll()) {
            if (other.getId().equals(row.getId())) {
                continue;
            }
            if (other.getCode().equalsIgnoreCase(c)) {
                return ApiResponse.error("The code " + other.getCode() + " already exists");
            }
            if (norm(other.getPercentage()).compareTo(p) == 0) {
                return ApiResponse.error(p.stripTrailingZeros().toPlainString() + "% already has the code " + other.getCode());
            }
        }
        row.setCode(c);
        row.setPercentage(p);
        if (active != null || row.getActive() == null) {
            row.setActive(active == null || active);
        }
        row.setNote(note == null || note.isBlank() ? null : note.trim().length() > 255 ? note.trim().substring(0, 255) : note.trim());
        row = repository.save(row);
        return ApiResponse.success(id == null ? "Margin code added" : "Margin code saved", one(row));
    }

    public ApiResponse<String> delete(Long id) {
        if (!repository.existsById(id)) {
            return ApiResponse.error("Margin code not found");
        }
        repository.deleteById(id);
        return ApiResponse.success("Margin code deleted", null);
    }

    private static Map<String, Object> one(MarginCode c) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", c.getId());
        row.put("code", c.getCode());
        row.put("percentage", c.getPercentage());
        row.put("active", Boolean.TRUE.equals(c.getActive()));
        row.put("note", c.getNote());
        return row;
    }

    // ------------------------------------------------------------------ what staff are given

    /**
     * For a screen that shows codes: the codes that can be chosen (no percentages), and the code of
     * each category's default margin a new quotation starts from.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> options() {
        List<Map<String, Object>> codes = new ArrayList<>();
        for (MarginCode c : repository.findAllByOrderByPercentageAsc()) {
            if (Boolean.TRUE.equals(c.getActive())) {
                codes.add(Map.of("code", c.getCode()));
            }
        }
        Map<BigDecimal, String> byPercent = byPercent();
        Map<String, Object> defaults = new LinkedHashMap<>();
        for (String category : CATEGORIES) {
            BigDecimal pct = systemSettingService.getMarginPercentage(category);
            defaults.put(category, pct == null ? null : byPercent.get(norm(pct)));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("codes", codes);
        out.put("defaults", defaults);
        return out;
    }

    /** Percentage → code, for every code (also switched-off ones: a quotation using one still shows it). */
    @Transactional(readOnly = true)
    public Map<BigDecimal, String> byPercent() {
        Map<BigDecimal, String> out = new HashMap<>();
        for (MarginCode c : repository.findAll()) {
            out.put(norm(c.getPercentage()), c.getCode());
        }
        return out;
    }

    /** The code of a percentage, or null when no code stands for it ("custom"). */
    public static String codeOf(Map<BigDecimal, String> byPercent, BigDecimal percentage) {
        return percentage == null ? null : byPercent.get(norm(percentage));
    }

    /**
     * The percentages of the codes someone chose, by field name. A blank or missing code means
     * "no change". A code that does not exist is refused, before anything is written.
     */
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> resolve(Map<String, String> chosen) {
        Map<String, BigDecimal> byCode = new HashMap<>();
        for (MarginCode c : repository.findAll()) {
            byCode.put(c.getCode().toUpperCase(Locale.ROOT), c.getPercentage());
        }
        Map<String, BigDecimal> out = new LinkedHashMap<>();
        for (Map.Entry<String, String> e : chosen.entrySet()) {
            String code = e.getValue() == null ? "" : e.getValue().trim();
            if (code.isEmpty()) {
                continue;
            }
            BigDecimal pct = byCode.get(code.toUpperCase(Locale.ROOT));
            if (pct == null) {
                throw new IllegalArgumentException("There is no margin code " + code + ". Choose one from the list");
            }
            out.put(e.getKey(), pct);
        }
        return out;
    }
}
