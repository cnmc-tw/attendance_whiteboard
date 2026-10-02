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
    // _result: ApiResponse<ProfileList>, // 前綴加 _ 避免 no-unused-vars 警告
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
    const [refetchIndex, setRefetchIndex] = useState(0);

    // 用於提供外部手動重新整理
    const refetch = useCallback(() => {
        setRefetchIndex((prev) => prev + 1);
    }, []);

    // 將陣列轉為字串變數，確保相依性比對是 Simple Expression
    const roleKey = role?.join(",");

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        async function executeFetch() {
            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();

                if (search) {
                    params.set("search", search);
                }

                if (role && role.length > 0) {
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
                    `/api/users?${params.toString()}`,
                    { signal: controller.signal }
                );

                const result: ApiResponse<ProfileList> = await response.json();

                if (!response.ok || !result.success) {
                    throw new UsersRequestError(
                        parseUsersError(response) //, result)
                    );
                }

                if (isMounted) {
                    setData(result.data);
                }
            } catch (err: unknown) {
                // 如果是 AbortController 引起的取消請求，忽略錯誤處理
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                if (isMounted) {
                    if (err instanceof UsersRequestError) {
                        setError(err.details);
                    } else {
                        setError({ type: "UNKNOWN" });
                    }
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        executeFetch();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [search, roleKey, sort, page, pageSize, refetchIndex, role]);

    return {
        data,
        isLoading,
        error,
        refetch,
    };
}