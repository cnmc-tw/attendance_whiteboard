import { type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(
    request: NextRequest,
) {
    return updateSession(request);
}

export const config = {
    matcher: [
    "/((?!api|auth/callback|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)",
    ],
};