package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import com.fleetmanagement.kitchencrmbackend.modules.quotation.entity.QuotationKitchen;
import com.fleetmanagement.kitchencrmbackend.modules.quotation.repository.QuotationLightingRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The rates already saved on a quotation's lighting lines.
 *
 * <p>Saving a quotation deletes every line and builds it again from what the screen sent. Staff
 * are never sent a unit price, so on a staff save the screen cannot say what a light that is
 * already on the quotation costs — that has to come from what was stored before the delete.
 *
 * <p>The screen does not send a line's own id, so a line is recognised by what it is: its type
 * and item id (a custom light's item id is unique to that light). The same item can sit in
 * several kitchens, possibly at different rates, and kitchens carry no id either — so the kitchen
 * is recognised by its name and position: both for a kitchen left alone, the name when an earlier
 * kitchen was removed (the screen renumbers the rest), the position when it was renamed.
 */
final class StoredLightingRates {

    static final StoredLightingRates NONE = new StoredLightingRates();

    private final Map<String, BigDecimal> inSameKitchen = new HashMap<>();
    private final Map<String, BigDecimal> inKitchenNamed = new HashMap<>();
    private final Map<String, BigDecimal> inKitchenAt = new HashMap<>();
    private final Map<String, BigDecimal> anywhere = new HashMap<>();

    private StoredLightingRates() {
    }

    static StoredLightingRates of(List<QuotationLightingRepository.StoredRate> lines) {
        StoredLightingRates rates = new StoredLightingRates();
        for (QuotationLightingRepository.StoredRate line : lines) {
            // A rate of zero is a line nobody has priced yet, not a price worth keeping.
            if (line.getItemType() == null || line.getItemId() == null
                    || line.getUnitPrice() == null || line.getUnitPrice().signum() <= 0) {
                continue;
            }
            String item = line.getItemType().name() + ":" + line.getItemId();
            String name = line.getKitchenName();
            Integer order = line.getKitchenOrder();
            rates.inSameKitchen.putIfAbsent(name + "|" + order + "|" + item, line.getUnitPrice());
            rates.inKitchenNamed.putIfAbsent(name + "|" + item, line.getUnitPrice());
            rates.inKitchenAt.putIfAbsent(order + "|" + item, line.getUnitPrice());
            rates.anywhere.putIfAbsent(item, line.getUnitPrice());
        }
        return rates;
    }

    /**
     * The stored rate of this item, or null when the quotation does not have it priced.
     *
     * @param kitchen the kitchen the line is being saved into; null for a line outside any kitchen
     */
    BigDecimal find(QuotationKitchen kitchen, String itemType, Long itemId) {
        String item = itemType + ":" + itemId;
        String name = kitchen != null ? kitchen.getKitchenName() : null;
        Integer order = kitchen != null ? kitchen.getKitchenOrder() : null;
        BigDecimal rate = inSameKitchen.get(name + "|" + order + "|" + item);
        if (rate == null) {
            rate = inKitchenNamed.get(name + "|" + item);
        }
        if (rate == null) {
            rate = inKitchenAt.get(order + "|" + item);
        }
        return rate != null ? rate : anywhere.get(item);
    }
}
