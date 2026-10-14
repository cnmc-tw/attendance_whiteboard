// Shared guard against open-redirect (V5).
// Only same-origin absolute paths are allowed as post-login redirect targets.
export function safeInternalPath(
    raw: string | null | undefined,
    fallback = "/",
): string {
    if (!raw) return fallback;
    // Must be a single-slash absolute path.
    if (!raw.startsWith("/")) return fallback;
    // Reject protocol-relative ("//evil") and backslash tricks ("/\\evil").
    if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
    // Reject control characters / embedded CR-LF.
    if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
    return raw;
}
