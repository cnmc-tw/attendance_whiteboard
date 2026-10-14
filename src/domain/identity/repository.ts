import {
    Profile,
    Role,
    CreateProfileInput,
    UpdateProfileInput,
    ProfileSyncInput,
    ProfileQuery,
    ProfileList,
} from "./types";


export interface ProfileRepository {

    getUserByEmail(email: string): Promise<Profile | null>;

    getUserByUid(uid: string): Promise<Profile | null>;

    getUsersByRole(role: Role): Promise<Profile[]>;

    getUsers(): Promise<Profile[]>;

    find(query: ProfileQuery): Promise<ProfileList>;

    synchronize(input: ProfileSyncInput): Promise<void>;

    create(profile: CreateProfileInput): Promise<void>;

    update(
        email: string,
        profile: UpdateProfileInput
    ): Promise<void>;

    delete(email: string): Promise<void>;
}