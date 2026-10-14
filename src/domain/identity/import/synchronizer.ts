import type {
    Profile,
    CreateProfileInput,
    ProfileSyncInput,
    UpdateProfileInput 
} from "../types";

import type {
    ProfileDiff,
    ProfileImportRow
} from "./types";


import type { ProfileRepository } from "../repository";


export interface ProfileSynchronizer {
    synchronize(diff: ProfileDiff): Promise<void>;
}

class DefaultProfileSynchronizer
    implements ProfileSynchronizer
{
    constructor(
        private readonly profileRepository: ProfileRepository,
    ) {}

    async synchronize(diff: ProfileDiff): Promise<void> {
        const input = this.toProfileInput(diff);

        await this.profileRepository.synchronize(input);
    }

    private toProfileInput(
        diff: ProfileDiff,
    ): ProfileSyncInput {
        return {
            create: diff.create.map((profile) =>
                this.toCreate(profile),
            ),

            update: diff.update.map(({ current, incoming }) => ({
                email: current.email,
                profile: this.toUpdate(current, incoming),
            })),

            remove: diff.remove.map(
                (profile) => profile.email,
            ),
        };
    }

    private toCreate(
        profile: ProfileImportRow,
    ): CreateProfileInput {

        return {
            email: profile.email,
            name: profile.name ?? "",
            role: profile.role,
            class: profile.class ?? null,
        };
    }

    private toUpdate(
        current: Profile,
        incoming: ProfileImportRow,
    ): UpdateProfileInput {

        return {
            name: incoming.name ?? current.name,
            role: incoming.role,
            class: incoming.class ?? current.class,
        };
    }
}

export function createProfileSynchronizer(
    profileRepository: ProfileRepository,
): ProfileSynchronizer {
    return new DefaultProfileSynchronizer(
        profileRepository,
    );
}