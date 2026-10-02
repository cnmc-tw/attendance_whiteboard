export class RateLimitError extends Error {
    constructor(
        public readonly retryAfter: number,
        message = "Too many requests",
    ) {
        super(message);
        this.name = "RateLimitError";
    }
}