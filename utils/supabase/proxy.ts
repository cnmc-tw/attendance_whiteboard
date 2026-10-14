import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
    request: NextRequest,
    requestHeaders: Headers,
): Promise<NextResponse> {
    let response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },

                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });

                    // 將更新後的 Cookie 同步到下游請求
                    requestHeaders.set(
                        "cookie",
                        request.cookies.toString(),
                    );

                    response = NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    });

                    cookiesToSet.forEach(
                        ({ name, value, options }) => {
                            response.cookies.set(name, value, options);
                        },
                    );
                },
            },
        },
    );

    const { data } = await supabase.auth.getClaims();
    const { pathname } = request.nextUrl;
    const user = data?.claims;

    const isProtected =
        pathname === "/" ||
        pathname.startsWith("/manage");

    if (isProtected && !user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set(
            "redirect_to",
            request.nextUrl.pathname + request.nextUrl.search,
        );

        return NextResponse.redirect(loginUrl);
    }

    return response;
}