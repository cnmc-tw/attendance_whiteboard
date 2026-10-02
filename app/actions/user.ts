"use server";

import { requireSupervisor } from "@/src/dal/auth";

import { createContainer } from "@/src/container";

import { CreateProfileInput, UpdateProfileInput } from "@/src/domain/identity";

type ActionResult<T = void> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        error: "VALIDATION_ERROR"
            | "DUPLICATE_EMAIL"
            | "NOT_FOUND"
            | "FORBIDDEN"
            | "UNKNOWN";
    };

export async function createUser(
    input: CreateProfileInput,
) {
    await requireSupervisor();

    const container = await createContainer();

    return container.profileService.create(input);
}


export async function updateUser(
    email: string,
    input: UpdateProfileInput,
) {
    await requireSupervisor();

    const container = await createContainer();

    return container.profileService.update(
        email,
        input,
    );
}