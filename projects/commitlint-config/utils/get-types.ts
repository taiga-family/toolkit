import {readdirSync, statSync} from 'node:fs';

export function getTypes(dir: string): string[] {
    try {
        return readdirSync(dir).filter((entity) =>
            statSync(`${dir}/${entity}`).isDirectory(),
        );
    } catch {
        return [];
    }
}
