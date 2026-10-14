import { SessionProvider, UserProvider } from "../provider";
import { ProfileRepository } from "../../identity";


export interface SessionService {

    exchangeCodeForSession(code: string): Promise<void>;

}


class DefaultSessionService implements SessionService {

    constructor(
        private readonly sessionProvider: SessionProvider,
        private readonly userProvider: UserProvider,
        private readonly profileRepository: ProfileRepository,
    ) {}

    async exchangeCodeForSession(code: string): Promise<void> {
        await this.sessionProvider.exchangeCodeForSession(code);

        // V2/V4: linking is performed server-side against a *verified* email.
        // The client can no longer write auth_user_id / name directly; the
        // RPC is the single trusted path and is idempotent.
        await this.sessionProvider.linkIdentity();
    }

}

export function createSessionService(
    sessionProvider: SessionProvider,
    userProvider: UserProvider,
    profileRepository: ProfileRepository
): SessionService {
    return new DefaultSessionService(
        sessionProvider,
        userProvider,
        profileRepository
    );
}
