const APP_TIME_ZONE = "Asia/Taipei";

const WEEKDAY_MAP = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
} as const;

type Weekday = keyof typeof WEEKDAY_MAP;

const WEEKDAY_NAME = {
    Sun: "日",
    Mon: "一",
    Tue: "二",
    Wed: "三",
    Thu: "四",
    Fri: "五",
    Sat: "六",
} as const;

function now(): Date {
    // eslint-disable-next-line no-restricted-syntax
    return new Date();
}

function getParts(value: Date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    }).formatToParts(value);

    return Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    ) as {
        year: string;
        month: string;
        day: string;
        weekday: Weekday;
    };
}

function date(value: Date = now()): string {
    const { year, month, day } = getParts(value);

    return `${year}-${month}-${day}`;
}

function year(value: Date = now()): number {
    return Number(getParts(value).year);
}

function time(value: Date = now()): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: APP_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(value);
}

function day(value: Date = now()): number {
    return WEEKDAY_MAP[getParts(value).weekday];
}

function formatRepublicDate(value: Date = now()): string {
    const { year, month, day, weekday } = getParts(value);

    return `中華民國${Number(year) - 1911}年${Number(month)}月${Number(day)}日 (${WEEKDAY_NAME[weekday]})`;
}

function formatTime(value: Date): string {
    return new Intl.DateTimeFormat("zh-TW", {
        timeZone: APP_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(value);
}

function formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat("zh-TW", {
        timeZone: APP_TIME_ZONE,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(value);
}

function relative(
    value: Date | string,
    reference: Date = now(),
): string {
    const target = typeof value === "string"
        ? new Date(value)
        : value;

    if (Number.isNaN(target.getTime())) {
        throw new RangeError("Invalid date");
    }

    const diffMs = reference.getTime() - target.getTime();

    if (diffMs < 0) {
        return "即將";
    }

    const seconds = Math.floor(diffMs / 1000);

    if (seconds < 60) {
        return "剛剛";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} 分鐘前`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} 小時前`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) {
        return `昨天 ${formatTime(target)}`;
    }

    if (days < 7) {
        return `${days} 天前`;
    }

    return formatDateTime(target);
}

export const AppTime = {
    now,
    date,
    time,
    day,
    year,
    formatRepublicDate,
    relative,
} as const;