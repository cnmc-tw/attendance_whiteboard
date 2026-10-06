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

function now(): Date {
    return new Date();
}

function date(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIME_ZONE,
    }).format(now());
}

function time(): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: APP_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).format(now());
}

function day(): number {
    const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: APP_TIME_ZONE,
        weekday: "short",
    }).format(now()) as Weekday;

    return WEEKDAY_MAP[weekday];
}

export const AppTime = {
    now,
    date,
    time,
    day,
} as const;