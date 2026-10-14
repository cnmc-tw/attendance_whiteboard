import type { Profile } from "../types";

import type {
    ProfileDiff,
    ProfileImportRow,
    ProfileUpdate,
} from "./types";

export function diffProfiles(
    imported: ProfileImportRow[],
    current: Profile[],
): ProfileDiff {
    const currentByEmail = new Map(
        current.map((profile) => [profile.email, profile]),
    );

    const importedEmails = new Set<string>();

    const create: ProfileImportRow[] = [];
    const update: ProfileUpdate[] = [];
    const unchanged: Profile[] = [];

    for (const incoming of imported) {
        importedEmails.add(incoming.email);

        const existing = currentByEmail.get(incoming.email);

        if (!existing) {
            create.push(incoming);
            continue;
        }

        const name = incoming.name ?? existing.name;

        const changed =
            name !== existing.name ||
            incoming.role !== existing.role ||
            incoming.class !== existing.class;

        if (changed) {
            update.push({
                current: existing,
                incoming,
            });
        } else {
            unchanged.push(existing);
        }
    }

    const deleted = current.filter(
        (profile) => !importedEmails.has(profile.email),
    );

    return {
        create,
        update,
        unchanged,
        remove: deleted,
    };
}