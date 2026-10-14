

import { createClient } from "@/utils/supabase/client";

import type { AuthenticationProvider } from "../../domain/auth/provider";

// School Google Workspace domain. `hd` is only a UX hint on Google's side;
// the real enforcement lives in identity.link_identity() (email_verified +
// DB allow-list) and in the Supabase dashboard provider settings.
const WORKSPACE_HD = "gs.hs.ntnu.edu.tw";

export class SupabaseAuthenticationProvider
    implements AuthenticationProvider {

    private readonly supabase = createClient();

    async signInWithGoogle(redirectUrl: string = ""): Promise<void> {

        const origin = typeof window !== 'undefined' ? window.location.origin : ''

        const { error } =
            await this.supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo:
                        `${origin}/auth/callback?redirect_to=${encodeURIComponent(redirectUrl)}`,
                    queryParams: {
                        hd: WORKSPACE_HD,
                        prompt: "select_account",
                    },
                },
            });

        if (error) {
            throw error;
        }
    }

    async signInWithGoogleIdToken(
        provider: string,
        token: string,
    ): Promise<void> {
        // Hardened: only Google id-token sign-in is permitted here (V6/V15).
        if (provider !== "google") {
            throw new Error("Unsupported identity provider");
        }
        const { error } =
            await this.supabase.auth.signInWithIdToken({
                provider,
                token,
            });

        if (error) {
            throw error;
        }
    }

    async signOut(): Promise<void> {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            throw error;
        }
    }

    async refreshSession(): Promise<void> {
        const { error } = await this.supabase.auth.refreshSession();
        if (error) {
            throw error;
        }
    }
}
