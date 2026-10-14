import { ColumnValidator } from "./base";

import { EMAIL_DOMAIN } from "../../../types";

const EMAIL_REGEX = new RegExp(`^[a-zA-Z0-9._%+-]+${EMAIL_DOMAIN.replace(".", "\\.")}$`,
);

export const emailValidator: ColumnValidator<string> = (value) => {
    const email = value.trim().toLowerCase();

    if (!email) {
        return {
            success: false,
            message: "Email 不得為空",
        };
    }

    if (!EMAIL_REGEX.test(email)) {
        return {
            success: false,
            message: "Email 格式錯誤",
        };
    }

    return {
        success: true,
        value: email,
    };
};