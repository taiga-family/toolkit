import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

export function projectJsonExist(filename: string): string {
    try {
        const path = require('node:path').resolve(filename);

        return require('node:fs').existsSync(path) ? path : '';
    } catch {
        return '';
    }
}
