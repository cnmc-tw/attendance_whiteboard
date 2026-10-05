
export const EMAIL_DOMAIN = "@gs.hs.ntnu.edu.tw";

export interface Profile {

    email: string;

    auth_user_id: string;

    name: string;

    role: Role;

    class: string;
}

export interface CreateProfileInput {
    email: string;
    name: string;
    role: Role;
    class: string | null;
}

export interface UpdateProfileInput {
    name: string;
    role: Role;
    class: string | null;
}

export type Role =
    | 'monitor'
    | 'instructor'
    | 'supervisor'

export interface ProfileQuery {
    search?: string;
    role?: Role[];
    class?: string[];
    sort?: ProfileSort;
    page: number;
    pageSize: number;
}

export type ProfileSort =
    | "class-asc"
    | "class-desc"
    | 'email-asc'
    | 'email-desc'
    | 'newest'
    | 'oldest'

export interface ProfileList {
    
    items: Profile[];

    total: number;

    page: number;

    pageSize: number;
}