import {
    CreateProfileInput,
    UpdateProfileInput,
    Profile, ProfileQuery,
    ProfileList,
    Role,
    EMAIL_DOMAIN
} from "./types";

import { ProfileRepository } from "./repository";
import { ValidationError, NotFoundError, ConflictError } from "@/src/application/errors";


export interface ProfileService {
    getUserByEmail(email: string): Promise<Profile | null>;

    create(
        input: CreateProfileInput,
    ): Promise<void>;

    update(
        email: string,
        input: UpdateProfileInput,
    ): Promise<void>;

    find(
        query: ProfileQuery,
    ): Promise<ProfileList>;
}

class DeraultProfileService 
    implements ProfileService {

    constructor(
        private readonly profileRepository: ProfileRepository,
    ) {}

    async getUserByEmail(
        email: string,
    ): Promise<Profile | null> {
        return this.profileRepository.getUserByEmail(email);
    }

    async create(
        input: CreateProfileInput,
    ): Promise<void> {
        const normalized = this.normalizeInput(input);

        this.validateRoleClass(
            normalized.role,
            normalized.class,
        );

        const existing =
            await this.profileRepository.getUserByEmail(
                normalized.email,
            );

        if (existing) {
            throw new ConflictError(
                "A profile with this email already exists",
            );
        }

        if (!input.email.endsWith(EMAIL_DOMAIN)) {
            throw new ValidationError(
                "Only school Google Workspace accounts are allowed",
            );
        }

        return this.profileRepository.create(normalized);
    }

    async update(
        email: string,
        input: UpdateProfileInput,
    ): Promise<void> {
        const normalized = this.normalizeInput(input);

        this.validateRoleClass(
            normalized.role,
            normalized.class,
        );

        const existing =
            await this.profileRepository.getUserByEmail(email);

        if (!existing) {
            throw new NotFoundError(
                "Profile not found",
            );
        }

        return this.profileRepository.update(
            email,
            normalized,
        );
    }

    async find(
        query: ProfileQuery,
    ): Promise<ProfileList> {
        return this.profileRepository.find(query);
    }

    private normalizeInput(
        input: CreateProfileInput | UpdateProfileInput,
    ) {
        return {
            ...input,
            email:
                "email" in input
                    ? input.email.trim().toLowerCase()
                    : "",
            name: input.name.trim(),
            class:
                input.class?.trim() || null,
        };
    }

    private validateRoleClass(
        role: Role,
        className: string | null,
    ) {
        if (
            role === "monitor" &&
            !className
        ) {
            throw new ValidationError(
                "Monitor must have a class",
            );
        }

        if (
            role !== "monitor" &&
            className !== null
        ) {
            throw new ValidationError(
                "Only monitor can have a class",
            );
        }
    }
}

export function createProfileService(
    profileRepository: ProfileRepository,
): ProfileService {
    return new DeraultProfileService(profileRepository);
}