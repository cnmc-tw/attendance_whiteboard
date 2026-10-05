export type ReportSubmissionErrorCode =
    | "UNAUTHORIZED"
    | "NOT_MONITOR"
    | "INVALID_MONITOR_CLASS"
    | "REPORT_NOT_ALLOWED"
    | "REPORT_COOLDOWN"
    | "SETTINGS_NOT_CONFIGURED"
    | "INVALID_PAYLOAD"


export class ReportSubmissionError extends Error {
    constructor(
        public readonly code: ReportSubmissionErrorCode
    ) {
        super(code);
        this.name = "ReportSubmissionError";
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ValidationError"
    }
}


export class UnauthorizedError extends Error {
    constructor(message = "Authentication required") {
        super(message);

        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends Error {
    constructor(message = "Access denied") {
        super(message);

        this.name = "ForbiddenError";
    }
}


export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "NotFoundError"
    }
}


export class ConflictError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "ConflictError"
    }
}
