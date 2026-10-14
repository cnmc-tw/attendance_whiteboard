import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const isDev = process.env.NODE_ENV === "development";

    const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        [
            "script-src",
            "'self'",
            `'nonce-${nonce}'`,
            ...(isDev ? ["'unsafe-eval'"] : []),
            "https://accounts.google.com/gsi/client",
            "https://va.vercel-scripts.com",
            "https://vercel.lives.com",
        ].join(" "),
        [
            "style-src",
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://accounts.google.com/gsi/style",
        ].join(" "),
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https:",
        [
            "connect-src",
            "'self'",
            "https://vercel.live/",
            "https://*.supabase.co",
            "https://*.upstash.io",
        ].join(" "),
        "frame-src 'self' https://accounts.google.com",
    ].join("; ");

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("Content-Security-Policy", csp);
    requestHeaders.set("x-nonce", nonce);

    const response = await updateSession(request, requestHeaders);

    // 設定瀏覽器收到的 CSP
    response.headers.set("Content-Security-Policy", csp);

    return response;
}

export const config = {
    matcher: [
        "/((?!api|auth/callback|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)",
    ],
};