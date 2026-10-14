import { createContainer } from '@/src/container';


import { requireInstructor } from '@/src/dal/auth';

import { UnauthorizedError, ForbiddenError, ValidationError } from "@/src/application/errors";

const MAX_LIMIT = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseLimit(raw: string | null): number | undefined {
    if (raw === null) return undefined;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
        throw new ValidationError("Invalid limit");
    }
    return n;
}

function parseBefore(raw: string | null): string | undefined {
    if (raw === null) return undefined;
    // Strict YYYY-MM-DD and a real calendar date.
    if (!DATE_RE.test(raw) || Number.isNaN(Date.parse(raw))) {
        throw new ValidationError("Invalid before");
    }
    return raw;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ classNo: string }> },
) {
    try {
        await requireInstructor();

        const { classNo } = await params;

        const searchParams = new URL(request.url).searchParams;

        const before = parseBefore(searchParams.get("before"));
        const limit = parseLimit(searchParams.get("limit"));

        const container = await createContainer();

        const result =
            await container.reportService.getClassHistory({
                classNo: classNo,
                before,
                limit,
            });

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return Response.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 },
            );
        }

        if (error instanceof ForbiddenError) {
            return Response.json(
                { success: false, error: "FORBIDDEN" },
                { status: 403 },
            );
        }

        if (error instanceof ValidationError) {
            return Response.json(
                { success: false, error: "INVALID_QUERY" },
                { status: 400 },
            );
        }

        throw error;
    }
}
