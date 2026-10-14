import type { SupabaseClient } from "@supabase/supabase-js";

import {
    Profile,
    CreateProfileInput,
    UpdateProfileInput,
    ProfileSyncInput,
    ProfileQuery,
    ProfileList,
    ProfileRepository,
    Role
} from "../../domain/identity"

import { ValidationError, MonitorImportErrorCode, MonitorImportError, UnauthorizedError, ForbiddenError } from "@/src/application/errors";


export class SupabaseProfileRepository
    implements ProfileRepository {

    constructor(
        protected readonly client: SupabaseClient,
    ) {}

    private from() {
        return this.client
            .schema("identity")
            .from("users");
    }

    private isMonitorImportErrorCode(
        value: string
    ): value is MonitorImportErrorCode {
        return [
            "INVALID_PROFILE_SYNC_INPUT",
            "INVALID_MONITOR_PROFILE",
        ].includes(value as MonitorImportErrorCode);
    }

    private buildQuery(query: ProfileQuery) {
        function escapeSearchValue(value: string): string {
            return value
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"')
                .replace(/%/g, "\\%")
                .replace(/_/g, "\\_");
        }
        
        let q = this.from()
            .select("*", { count: "exact" });
        const search = query.search?.trim();

        const MAX_SEARCH_LENGTH = 100;

        if (search && search.length > MAX_SEARCH_LENGTH) {
            throw new ValidationError("Search query is too long");
        }

        if (search) {
            const value = escapeSearchValue(search);

            q = q.or([
                `email.ilike.*${value}*`,
                `name.ilike.*${value}*`,
                `class.ilike.*${value}*`,
            ].join(","));
        }

        if (query.role?.length) {
            q = q.in("role", query.role);
        }

        if (query.class?.length) {
            q = q.in("class", query.class);
        }

        switch (query.sort) {
            case "class-asc":
                q = q
                    .order("class", { ascending: true })
                    .order("email", { ascending: true });
                break;

            case "class-desc":
                q = q
                    .order("class", { ascending: false })
                    .order("email", { ascending: true });
                break;

            case "email-asc":
                q = q.order("email", { ascending: true });
                break;

            case "email-desc":
                q = q.order("email", { ascending: false });
                break;

            case "newest":
                q = q.order("created_at", { ascending: false });
                break;

            case "oldest":
                q = q.order("created_at", { ascending: true });
                break;
        }

        return q;
    }

    async getUserByEmail(
        email: string
    ): Promise<Profile | null> {
        const { data, error } = await this.from()
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return data;
    }

    async getUserByUid(
        uid: string
    ): Promise<Profile | null> {
        const { data, error } = await this.from()
            .select("*")
            .eq("auth_user_id", uid)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return data;
    }

    async getUsersByRole(
        role: Role
    ): Promise<Profile[]> {
        const pageSize = 500;
        const profiles: Profile[] = [];
        for (let from = 0; ; from += pageSize) {
            const { data, error } = await this.from()
                .select("*")
                .eq("role", role)
                .order("email", { ascending: true })
                .range(from, from + pageSize - 1);
            if (error) throw error;
            profiles.push(...(data ?? []));
            if (!data || data.length < pageSize) return profiles;
        }
    }

    async getUsers(): Promise<Profile[]> {
        const { data, error } = await this.from()
            .select("*");

        if (error) {
            throw error;
        }

        return data;
    }

    async find(query: ProfileQuery): Promise<ProfileList> {
        const q = this.buildQuery(query)
            .range(
                (query.page - 1) * query.pageSize,
                query.page * query.pageSize - 1
            );
            
        const { data, count, error } = await q;
        if (error) {
            throw error;
        }

        return {
            items: data ?? [],
            total: count ?? 0,
            page: query.page,
            pageSize: query.pageSize,
        };
    }

    async synchronize(input: ProfileSyncInput): Promise<void> {
        const { error } = await this.client.schema("identity").rpc(
            "synchronize_monitor_profiles",
            {
                p_input: input,
            },
        );

        if (!error) {
            return;
        }


        if (error.code === "42501" && error.message === "UNAUTHORIZED") {
            throw new UnauthorizedError();
        }

        if (error.code === "42501" && error.message === "INSUFFICIENT_ROLE") {
            throw new ForbiddenError();
        }

        if (error.code === "22023" && this.isMonitorImportErrorCode(error.message)) {
            throw new MonitorImportError(error.message);
        }

        throw error;
    }

    async create(profile: CreateProfileInput): Promise<void> {
        const { error } = await this.from()
            .insert(profile);

        if (error) {
            throw error;
        }

    }

    async update(
        email: string,
        profile: UpdateProfileInput
    ): Promise<void> {
        const { error } = await this.from()
            .update({
                ...profile,
                email: email
            })
            .eq("email", email);

        if (error) {
            throw error;
        }
    }
    
    async delete(email: string): Promise<void> {
        const { error } = await this.from()
            .delete()
            .eq("email", email);

        if (error) {
            throw error;
        }
    }

    
}
