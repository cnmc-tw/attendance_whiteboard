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

        const user = await this.userProvider.get();

        if (!user?.email) {
            return;
        }

        const profile = await this.profileRepository.getUserByEmail(user.email);
        

        if (!profile) return;

        if (profile.auth_user_id !== user.id) {
            profile.auth_user_id = user.id;
            profile.name = user.user_metadata?.full_name;
            await this.profileRepository.update(user.email, profile);
        }
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