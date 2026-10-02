"use client";

import { useCallback, useEffect, useState } from "react";

import { Role, ProfileList, ProfileSort } from "../src/domain/identity";

type ApiResponse<T> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        error: string;
    };

export type UsersError =
    | {
        type: "UNAUTHORIZED";
    }
    | {
        type: "FORBIDDEN";
    }
    | {
        type: "INVALID_QUERY";
    }
    | {
        type: "RATE_LIMITED";
        retryAfter: number;
    }
    | {
        type: "UNKNOWN";
    };

export interface UsersQuery {
    search?: string;
    role?: Role[];
    sort?: ProfileSort;
    page: number;
    pageSize: number;
}

class UsersRequestError extends Error {
    constructor(
        public readonly details: UsersError,
    ) {
        super(details.type);
        this.name = "UsersRequestError";
    }
}


function parseUsersError(
    response: Response,
    result: ApiResponse<ProfileList>,
): UsersError {
    if (response.status === 401) {
        return { type: "UNAUTHORIZED" };
    }

    if (response.status === 403) {
        return { type: "FORBIDDEN" };
    }

    if (response.status === 400) {
        return { type: "INVALID_QUERY" };
    }

    if (response.status === 429) {
        const retryAfter = Number(
            response.headers.get("Retry-After") ?? 0
        );

        return {
            type: "RATE_LIMITED",
            retryAfter,
        };
    }

    return { type: "UNKNOWN" };
}

export function useUsers(query: UsersQuery) {
    const {
        search,
        role,
        sort,
        page,
        pageSize,
    } = query;

    const [data, setData] = useState<ProfileList>({
        items: [],
        total: 0,
        page: 0,
        pageSize: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<UsersError | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            if (search) {
                params.set("search", search);
            }

            if (role) {
                for (const value of role) {
                    params.append("role", value);
                }
            }

            if (sort) {
                params.set("sort", sort);
            }

            params.set("page", String(page));
            params.set("pageSize", String(pageSize));

            const response = await fetch(
                `/api/users?${params.toString()}`
            );

            const result: ApiResponse<ProfileList> =
                await response.json();

            if (!response.ok || !result.success) {
                throw new UsersRequestError(
                    parseUsersError(response, result)
                );
            }

            setData(result.data);
        } catch (error) {
            if (
                typeof error === "object" &&
                error !== null &&
                "type" in error
            ) {
                setError(error as UsersError);
            } else {
                setError({ type: "UNKNOWN" });
            }
        } finally {
            setIsLoading(false);
        }
    }, [
        search,
        sort,
        page,
        pageSize,
        role?.join(","),
    ]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchUsers,
    };
}