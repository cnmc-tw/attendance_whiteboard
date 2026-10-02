import { Profile, CreateProfileInput, UpdateProfileInput, ProfileQuery, ProfileList, Role } from "./types";


export interface ProfileRepository {

    getUserByEmail(email: string): Promise<Profile | null>;

    getUserByUid(uid: string): Promise<Profile | null>;

    getUsersByRole(role: Role): Promise<Profile[]>;

    getUsers(): Promise<Profile[]>;

    find(query: ProfileQuery): Promise<ProfileList>;

    create(profile: CreateProfileInput): Promise<void>;

    createMany(profiles: CreateProfileInput[]): Promise<void>;

    update(
        email: string,
        profile: UpdateProfileInput
    ): Promise<void>;

    delete(email: string): Promise<void>;

    deleteMany(emails: string[]): Promise<void>;

    deleteByRole(role: Role): Promise<void>;
}