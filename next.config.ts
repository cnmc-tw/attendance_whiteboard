import type { NextConfig } from "next";

// V8: baseline security headers. Tune the CSP to the exact third parties you
// load (Google sign-in button styles, Vercel analytics). Start in
// Report-Only if you need to observe violations before enforcing.
const securityHeaders = [
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    {
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "img-src 'self' data: https:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self'",
            "connect-src 'self' https://*.supabase.co https://*.upstash.io",
            "frame-src 'self' https://accounts.google.com",
        ].join("; "),
    },
];

const nextConfig: NextConfig = {
    experimental: {
        authInterrupts: true, // 啟用權限中斷功能
    },
    async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
    },
};

export default nextConfig;
