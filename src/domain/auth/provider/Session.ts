

export interface SessionProvider {

    exchangeCodeForSession(code: string): Promise<void>;

    // Binds the current Supabase auth user to its identity.users row via a
    // verified, server-side RPC (keys on email_verified + DB allow-list).
    linkIdentity(): Promise<void>;

}
