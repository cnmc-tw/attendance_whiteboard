import type { ColumnValidator } from "./base";

export const classValidator: ColumnValidator<string | null> = (value) => {
    const className = value.trim();

    if (!className) {
        return {
            success: true,
            value: null,
        };
    }

    // 這裡放你目前真正的班級格式規則
    if (!/^\d{4}$/.test(className)) {
        return {
            success: false,
            message: "班級格式錯誤",
        };
    }

    return {
        success: true,
        value: className,
    };
};