import type { SupabaseClient } from "@supabase/supabase-js";

import { SessionProvider } from "../../domain/auth/provider";

export class SupabaseSessionProvider
    implements SessionProvider {

    constructor(
        private readonly client: SupabaseClient,
    ) {}

    async exchangeCodeForSession(code: string): Promise<void> {

        const { error } =
            await this.client.auth.exchangeCodeForSession(code);

        if (error) {
            throw error;
        }
    }

    async linkIdentity(): Promise<void> {
        // SECURITY DEFINER RPC; only links when the JWT email is verified and
        // on the DB allow-list. Idempotent (safe to call on every login).
        const { error } = await this.client
            .schema("identity")
            .rpc("link_identity");

        if (error) {
            throw error;
        }
    }
}
