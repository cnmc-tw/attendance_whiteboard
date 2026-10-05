"use server";

import { createContainer } from "@/src/container";
import { requireSupervisor } from "@/src/dal/auth";
import { executeAction } from "@/src/application/actions/execute-action";
import type { ActionResult } from "@/src/application/actions/action-result";
import type {
    CreateProfileInput,
    UpdateProfileInput,
} from "@/src/domain/identity";

export async function createUser(
    input: CreateProfileInput,
): Promise<ActionResult<void>> {
    return executeAction(async () => {
        await requireSupervisor();

        const container = await createContainer();

        return container.profileService.create(input);
    });
}

export async function updateUser(
    email: string,
    input: UpdateProfileInput,
): Promise<ActionResult<void>> {
    return executeAction(async () => {
        await requireSupervisor();

        const container = await createContainer();

        return await container.profileService.update(
            email,
            input,
        );
    });
}