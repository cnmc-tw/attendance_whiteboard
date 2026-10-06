import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

type LeaveType = "sick" | "personal" | "official" | "other";

type ReportPayload = Partial<Record<LeaveType, number[]>>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY",
    );
}

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
);

const config = {
    days: 2,

    classStart: 1633,
    classCount: 75,

    minReportsPerDay: 1,
    maxReportsPerDay: 3,

    minAbsentStudents: 0,
    maxAbsentStudents: 8,

    studentNumberMin: 1,
    studentNumberMax: 50,

    submittedBy: "測試員aaa",
};

const leaveTypes: LeaveType[] = [
    "sick",
    "personal",
    "official",
    "other",
];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: T[]): T {
    return items[randomInt(0, items.length - 1)];
}

function isWeekday(date: Date): boolean {
    const day = date.getDay();

    return day !== 0 && day !== 6;
}

function toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function createPayload(): ReportPayload {
    const payload: ReportPayload = {};

    const absentCount = randomInt(
        config.minAbsentStudents,
        config.maxAbsentStudents,
    );

    if (absentCount === 0) {
        return payload;
    }

    const students = new Set<number>();

    while (students.size < absentCount) {
        students.add(
            randomInt(
                config.studentNumberMin,
                config.studentNumberMax,
            ),
        );
    }

    for (const student of students) {
        const type = randomItem(leaveTypes);

        payload[type] ??= [];
        payload[type].push(student);
    }

    return payload;
}

function createSubmittedAt(
    date: Date,
    reportIndex: number,
): string {
    const result = new Date(date);

    // 模擬早上的回報時間
    result.setHours(
        7,
        40 + reportIndex * 5,
        randomInt(0, 59),
        0,
    );

    return result.toISOString();
}

async function seed() {
    const reports: {
        class: number;
        report_date: string;
        submitted_by: string;
        submitted_at: string;
        payload: ReportPayload;
    }[] = [];

    // eslint-disable-next-line no-restricted-syntax
    const today = new Date();

    let generatedDays = 0;

    for (
        let offset = 1;
        generatedDays < config.days;
        offset++
    ) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);

        if (!isWeekday(date)) {
            continue;
        }

        const reportDate = toDateString(date);

        for (
            let classOffset = 0;
            classOffset < config.classCount;
            classOffset++
        ) {
            const classNo =
                config.classStart + classOffset;

            const reportCount = randomInt(
                config.minReportsPerDay,
                config.maxReportsPerDay,
            );

            for (
                let reportIndex = 0;
                reportIndex < reportCount;
                reportIndex++
            ) {
                reports.push({
                    class: classNo,
                    report_date: reportDate,
                    submitted_by: config.submittedBy,
                    submitted_at: createSubmittedAt(
                        date,
                        reportIndex,
                    ),
                    payload: createPayload(),
                });
            }
        }

        generatedDays++;
    }

    console.log(
        `Preparing ${reports.length} reports...`,
    );

    const { error } = await supabase
        .schema("attendance")
        .from("reports")
        .insert(reports);

    if (error) {
        throw error;
    }

    console.log(
        `Successfully inserted ${reports.length} reports.`,
    );
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
