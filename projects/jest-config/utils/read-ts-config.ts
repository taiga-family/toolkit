import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export function readTsConfig(): Record<string, Record<string, unknown>> {
    try {
        return JSON.parse(readFileSync(resolve(process.cwd(), 'tsconfig.json'), 'utf-8'));
    } catch {
        return {compilerOptions: {}};
    }
}
