import { createContainer } from '@/src/container';


import { requireInstructor } from '@/src/dal/auth';

import { UnauthorizedError, ForbiddenError, ValidationError } from "@/src/application/errors";


export async function GET(
    request: Request,
    { params }: { params: Promise<{ classNo: string }> },
) {
    try {
        await requireInstructor();

        const { classNo } = await params;

        const searchParams = new URL(request.url).searchParams;

        const before = searchParams.get("before") ?? undefined;
        const limitParam = searchParams.get("limit");

        const limit = limitParam
            ? Number(limitParam)
            : undefined;

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
                {
                    success: false,
                    error: "UNAUTHORIZED",
                },
                { status: 401 },
            );
        }

        if (error instanceof ForbiddenError) {
            return Response.json(
                {
                    success: false,
                    error: "FORBIDDEN",
                },
                { status: 403 },
            );
        }

        if (error instanceof ValidationError) {
            return Response.json(
                {
                    success: false,
                    error: "INVALID_QUERY",
                },
                { status: 400 },
            );
        }

        throw error;
    }
}