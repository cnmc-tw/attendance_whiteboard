import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

import { AppTime } from "@/shared/time";

const redis = Redis.fromEnv();

const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "attendance:user-rate-limit",
});

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter: number;
}

export async function checkUserRateLimit(
    userId: string,
): Promise<RateLimitResult> {
    const result = await limiter.limit(userId);

    const retryAfter = Math.max(
        0,
        Math.ceil((result.reset - AppTime.now().getTime()) / 1000),
    );

    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter,
    };
}