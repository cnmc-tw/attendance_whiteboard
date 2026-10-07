"use client";

import { useCallback, useEffect, useState } from "react";

import { ReportItem, Report } from "../src/domain/attendance";

type ClassHistoryResponse = {
    items: Report[];
    nextCursor: string | null;
    hasMore: boolean;
};

type UseClassHistoryResult = {
    items: ReportItem[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: Error | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
};

function toReportItem(report: Report): ReportItem {
    return {
        id: report.id,
        class: report.class,
        grade: 0,

        sick: report.payload.sick?.length ?? 0,
        personal: report.payload.personal?.length ?? 0,
        official: report.payload.official?.length ?? 0,
        other: report.payload.other?.length ?? 0,

        absentCount: Object.values(report.payload)
            .reduce((acc, arr) => acc + arr.length, 0),

        status: "reported",
        report_date: report.report_date,
        submitted_by: report.submitted_by,
        submitted_at: report.submitted_at,
    }
}

export function useClassHistory(
    classNo: string,
): UseClassHistoryResult {
    const [items, setItems] = useState<ReportItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchHistory = useCallback(
        async (before?: string) => {
            const params = new URLSearchParams();

            if (before) {
                params.set("before", before);
            }

            const query = params.toString();

            const response = await fetch(
                `/api/classes/${classNo}/history${
                    query ? `?${query}` : ""
                }`,
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to fetch class history",
                );
            }

            const result = await response.json();

            return result.data as ClassHistoryResponse;
        },
        [classNo],
    );

    useEffect(() => {
        let cancelled = false;

        async function loadInitial() {
            setIsLoading(true);
            setError(null);
            setItems([]);
            setNextCursor(null);
            setHasMore(true);

            try {
                const data = await fetchHistory();

                if (cancelled) {
                    return;
                }

                setItems(data.items.map(toReportItem));
                setNextCursor(data.nextCursor);
                setHasMore(data.hasMore);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setError(
                    error instanceof Error
                        ? error
                        : new Error(
                              "Failed to fetch class history",
                          ),
                );
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void loadInitial();
        

        return () => {
            cancelled = true;
        };
    }, [fetchHistory]);

    const loadMore = useCallback(async () => {
        if (
            isLoading ||
            isLoadingMore ||
            !hasMore
        ) {
            return;
        }

        setIsLoadingMore(true);
        setError(null);

        try {
            const data = await fetchHistory(nextCursor ?? undefined);

            setItems((current) => [
                ...current,
                ...data.items.map(toReportItem),
            ]);

            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error
                    : new Error(
                          "Failed to fetch class history",
                      ),
            );
        } finally {
            setIsLoadingMore(false);
        }
    }, [
        fetchHistory,
        hasMore,
        isLoading,
        isLoadingMore,
        nextCursor,
    ]);



    return {
        items,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        loadMore,
    };
}