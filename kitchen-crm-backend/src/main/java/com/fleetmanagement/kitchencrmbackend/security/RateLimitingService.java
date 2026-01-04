package com.fleetmanagement.kitchencrmbackend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // 5 attempts per 15 minutes per IP
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration REFILL_DURATION = Duration.ofMinutes(15);

    public boolean isAllowed(String key) {
        Bucket bucket = buckets.computeIfAbsent(key, this::createBucket);
        return bucket.tryConsume(1);
    }

    private Bucket createBucket(String key) {
        Bandwidth limit = Bandwidth.classic(MAX_ATTEMPTS, Refill.intervally(MAX_ATTEMPTS, REFILL_DURATION));
        return Bucket.builder().addLimit(limit).build();
    }

    public long getWaitTimeSeconds(String key) {
        Bucket bucket = buckets.get(key);
        if (bucket != null) {
            return bucket.getAvailableTokens() == 0
                ? REFILL_DURATION.toSeconds()
                : 0;
        }
        return 0;
    }
}
