import { createContainer } from '@/src/container';


import { requireInstructor } from '@/src/dal/auth';

import { Role, ProfileQuery, ProfileSort } from '@/src/domain/identity';

import { UnauthorizedError, ForbiddenError, ValidationError } from "@/src/errors";
import { NextRequest, NextResponse } from 'next/server';

import { checkUserRateLimit, RateLimitError } from '@/utils/upstash/redis';


function parsePositiveInteger(
    value: string | null,
    defaultValue: number,
): number {
    if (value === null) {
        return defaultValue;
    }

    const parsed = Number(value);

    if (
        !Number.isInteger(parsed) ||
        parsed < 1
    ) {
        throw new ValidationError(
            "Invalid integer",
        );
    }

    return parsed;
}

function parseRoles(values: string[]): Role[] {
    const roles = [...new Set(values)];

    for (const role of roles) {
        if (!ROLES.includes(role as Role)) {
            throw new ValidationError(
                "Invalid role",
            );
        }
    }

    return roles as Role[];
}

const PROFILE_SORTS: ProfileSort[] = [
    "class-asc",
    "class-desc",
    "email-asc",
    "email-desc",
    "newest",
    "oldest",
];


const ROLES: Role[] = [
    "monitor",
    "instructor",
    "supervisor",
];

const DEFAULT_SORT: ProfileSort = "class-asc";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

function parseProfileQuery(
    params: URLSearchParams,
): ProfileQuery {
    const rawSearch = params.get("search");
    const search = rawSearch?.trim() || undefined;

    if (search && search.length > MAX_SEARCH_LENGTH) {
        throw new ValidationError(
            "Search query is too long",
        );
    }

    const page = parsePositiveInteger(
        params.get("page"),
        DEFAULT_PAGE,
    );

    const pageSize = parsePositiveInteger(
        params.get("pageSize"),
        DEFAULT_PAGE_SIZE,
    );

    if (pageSize > MAX_PAGE_SIZE) {
        throw new ValidationError(
            "Page size is too large",
        );
    }

    const rawSort =
        params.get("sort") ?? DEFAULT_SORT;

    if (!PROFILE_SORTS.includes(rawSort as ProfileSort)) {
        throw new ValidationError(
            "Invalid sort",
        );
    }

    const rawRoles = params.getAll("role");

    const role = rawRoles.length
        ? parseRoles(rawRoles)
        : undefined;

    return {
        search,
        role,
        sort: rawSort as ProfileSort,
        page,
        pageSize,
    };
}



export async function GET(request: NextRequest) {
    try {

        const user = await requireInstructor()

        const rateLimit = await checkUserRateLimit(
            user.auth_user_id,
        );

        if (!rateLimit.success) {
            throw new RateLimitError(
                rateLimit.retryAfter,
            );
        }

        const query = parseProfileQuery(
            request.nextUrl.searchParams
        );

        const container = await createContainer();

        const result =
            await container.profileService.find(query);

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return NextResponse.json(
                {
                    success: false,
                    error: "UNAUTHORIZED",
                },
                { status: 401 },
            );
        }

        if (error instanceof ForbiddenError) {
            return NextResponse.json(
                {
                    success: false,
                    error: "FORBIDDEN",
                },
                { status: 403 },
            );
        }

        if (error instanceof ValidationError) {
            return NextResponse.json(
                {
                    success: false,
                    error: "INVALID_QUERY",
                },
                { status: 400 },
            );
        }

        if (error instanceof RateLimitError) {
            return NextResponse.json(
                {
                    success: false,
                    error: "RATE_LIMITED",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(
                            error.retryAfter,
                        ),
                    },
                },
            );
        }

        throw error;
    }
}