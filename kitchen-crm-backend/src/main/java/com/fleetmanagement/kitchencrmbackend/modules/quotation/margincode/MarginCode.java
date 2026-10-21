package com.fleetmanagement.kitchencrmbackend.modules.quotation.margincode;

import com.fleetmanagement.kitchencrmbackend.shared.audit.Auditable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * A code standing for one margin percentage (V161), set by the administrator. Staff allowed to see
 * margins see and choose the code; the percentage stays with the administrator.
 */
@Entity
@Table(name = "margin_codes")
@Getter
@Setter
@NoArgsConstructor
public class MarginCode extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 12)
    private String code;

    @Column(name = "percentage", nullable = false, precision = 6, scale = 2)
    private BigDecimal percentage;

    /** Switched off: no longer offered to staff; quotations that use it still show it. */
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "note")
    private String note;
}
