import {resolve} from 'node:path';

import {type JestConfigWithTsJest} from 'ts-jest';

import {tuiBaseJestConfig} from '../base.ts';

/**
 * Jest preset for plain Node / TypeScript projects.
 *
 * Uses `ts-jest` with `testEnvironment: 'node'` and pulls in no Angular
 * dependencies, so it can be consumed without `jest-preset-angular`.
 */
export default {
    ...tuiBaseJestConfig,
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|js|mjs)$': [
            'ts-jest',
            {
                diagnostics: true,
                tsconfig: resolve(process.cwd(), 'tsconfig.spec.json'),
                useESM: true,
            },
        ],
    },
} satisfies JestConfigWithTsJest;
