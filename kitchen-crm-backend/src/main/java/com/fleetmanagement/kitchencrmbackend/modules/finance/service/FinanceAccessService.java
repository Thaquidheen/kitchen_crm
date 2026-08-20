package com.fleetmanagement.kitchencrmbackend.modules.finance.service;

import com.fleetmanagement.kitchencrmbackend.modules.settings.entity.SystemSetting;
import com.fleetmanagement.kitchencrmbackend.modules.settings.repository.SystemSettingRepository;
import com.fleetmanagement.kitchencrmbackend.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The second factor in front of Income & Expenses.
 *
 * The module is concealed, not merely role-gated: the sidebar does not list it, the route behaves
 * like a typo, and the API answers 404 until this passphrase is presented. Role checks stay exactly
 * where they were — every finance endpoint is still @PreAuthorize SUPER_ADMIN — so this is an extra
 * lock, never a replacement for one. It exists because the super-admin login may be known to more
 * than one person while the passphrase is known to one.
 *
 * The phrase itself is stored only as a BCrypt hash, under a system_settings key that no endpoint
 * returns (SettingsController exposes only the margins/company/dashboard groups). It is never put in
 * an env file — this repo's .env is committed — and never shipped to the browser, which is the whole
 * reason the comparison happens here rather than in the frontend.
 */
@Service
public class FinanceAccessService {

    private static final Logger logger = LoggerFactory.getLogger(FinanceAccessService.class);

    /** Deliberately bland: a key named "finance_unlock" would advertise the feature in a DB dump. */
    static final String SETTING_KEY = "reporting_module_key";
    public static final String SCOPE = "finance";
    private static final long UNLOCK_TTL_MS = 45 * 60 * 1000L;

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_MS = 10 * 60 * 1000L;

    /** Per-user throttle. /auth/signin is already unthrottled; do not add a second free oracle. */
    private final Map<Long, Attempts> attempts = new ConcurrentHashMap<>();

    @Autowired
    private SystemSettingRepository settingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private static final class Attempts {
        int count;
        long blockedUntil;
    }

    /** True once a passphrase has been set; until then the module cannot be unlocked at all. */
    @Transactional(readOnly = true)
    public boolean isConfigured() {
        return settingRepository.findBySettingKey(SETTING_KEY)
                .map(s -> s.getSettingValue() != null && !s.getSettingValue().isBlank())
                .orElse(false);
    }

    /**
     * Sets the phrase. Free while none exists (first-time setup by the owner); afterwards the
     * current phrase must be supplied, so an open super-admin session cannot silently rotate it.
     */
    @Transactional
    public boolean setPassphrase(Long userId, String current, String next) {
        if (next == null || next.trim().length() < 8) {
            return false;
        }
        Optional<SystemSetting> existing = settingRepository.findBySettingKey(SETTING_KEY);
        boolean configured = existing.map(s -> s.getSettingValue() != null && !s.getSettingValue().isBlank())
                .orElse(false);
        if (configured) {
            // Rotation verifies the current phrase, which makes this a second guessing oracle —
            // and it shares the unlock's throttle deliberately. Without that, anyone locked out of
            // /unlock after five tries simply moved here and guessed without limit.
            Attempts state = attempts.computeIfAbsent(userId == null ? -1L : userId, id -> new Attempts());
            synchronized (state) {
                if (state.blockedUntil > System.currentTimeMillis()) {
                    return false;
                }
                if (current == null || !passwordEncoder.matches(current, existing.get().getSettingValue())) {
                    if (++state.count >= MAX_ATTEMPTS) {
                        state.blockedUntil = System.currentTimeMillis() + LOCKOUT_MS;
                        state.count = 0;
                        logger.warn("Reporting module key: too many failed rotation attempts for user {}, throttled", userId);
                    }
                    return false;
                }
                state.count = 0;
            }
        }
        SystemSetting setting = existing.orElseGet(SystemSetting::new);
        setting.setSettingKey(SETTING_KEY);
        setting.setSettingValue(passwordEncoder.encode(next.trim()));
        setting.setDescription("Internal reporting module access key");
        setting.setUpdatedAt(LocalDateTime.now());
        if (setting.getCreatedAt() == null) {
            setting.setCreatedAt(LocalDateTime.now());
        }
        settingRepository.save(setting);
        // No phrase in the log line, ever.
        logger.info("Reporting module key updated");
        return true;
    }

    /**
     * Returns a short-lived scoped token on a match, or empty on anything else — wrong phrase, no
     * phrase configured, or too many attempts. The caller must not distinguish these to the client.
     */
    @Transactional(readOnly = true)
    public Optional<String> unlock(Long userId, String passphrase) {
        if (userId == null || passphrase == null || passphrase.isBlank()) {
            return Optional.empty();
        }
        Attempts state = attempts.computeIfAbsent(userId, id -> new Attempts());
        synchronized (state) {
            if (state.blockedUntil > System.currentTimeMillis()) {
                return Optional.empty();
            }
            String hash = settingRepository.findBySettingKey(SETTING_KEY)
                    .map(SystemSetting::getSettingValue).orElse(null);
            if (hash == null || hash.isBlank() || !passwordEncoder.matches(passphrase, hash)) {
                if (++state.count >= MAX_ATTEMPTS) {
                    state.blockedUntil = System.currentTimeMillis() + LOCKOUT_MS;
                    state.count = 0;
                    logger.warn("Reporting module key: too many failed attempts for user {}, throttled", userId);
                }
                return Optional.empty();
            }
            state.count = 0;
            return Optional.of(tokenProvider.generateScopedToken(SCOPE, userId, UNLOCK_TTL_MS));
        }
    }

    public boolean isUnlocked(String token, Long userId) {
        return token != null && !token.isBlank() && tokenProvider.validateScopedToken(token, SCOPE, userId);
    }

    public long ttlSeconds() {
        return UNLOCK_TTL_MS / 1000;
    }
}
