import {readFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {resolve} from 'node:path';

import {type JestConfigWithTsJest, pathsToModuleNameMapper} from 'ts-jest';
import {type MapLike} from 'typescript';

process.env.TZ = 'Europe/Moscow';
process.env.FORCE_COLOR = 'true';
process.env.TS_JEST_DISABLE_VER_CHECKER = 'true';

const {compilerOptions} = readTsConfig();
const maxParallel = cpus().length / 2;

export default {
    bail: 1,
    cacheDirectory: '<rootDir>/node_modules/.cache/jest',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/**/*.ts'],
    coverageDirectory: '<rootDir>/coverage',
    coveragePathIgnorePatterns: ['node_modules', 'schematics', '.spec.ts', '.cy.ts'],
    coverageReporters: ['lcov', 'clover'],
    extensionsToTreatAsEsm: ['.ts'],
    maxConcurrency: maxParallel,
    maxWorkers: maxParallel,
    moduleNameMapper: pathsToModuleNameMapper(
        (compilerOptions?.paths as MapLike<string[]> | undefined) ?? {},
        {
            prefix: `<rootDir>/${compilerOptions?.baseUrl}/`
                .replaceAll('./', '/')
                .replaceAll(/\/\/+/g, '/'),
        },
    ),
    modulePathIgnorePatterns: ['.cache', 'dist', '<rootDir>/dist/'],
    passWithNoTests: true,
    preset: 'jest-preset-angular',
    reporters: ['default'],
    rootDir: process.cwd(),
    setupFilesAfterEnv: ['<rootDir>/node_modules/@taiga-ui/jest-config/polyfill.js'],
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/projects/**/*.spec.ts'],
    testPathIgnorePatterns: [
        '/cypress/',
        '/playwright/',
        '/node_modules/',
        '.pw.spec.ts',
    ],
    transform: {
        '^.+\\.(ts|js|mjs|html|svg)$': [
            'jest-preset-angular',
            {
                diagnostics: true,
                stringifyContentPathRegex: String.raw`\.html$`,
                tsconfig: resolve(process.cwd(), 'tsconfig.spec.json'),
            },
        ],
    },
    transformIgnorePatterns: [
        'node_modules/(?!@angular|rxjs|ngx-highlightjs|@maskito|parse5|@ng-web-apis|@taiga-ui).+',
    ],
    verbose: !process.env.CI,
} satisfies JestConfigWithTsJest;

function readTsConfig(): Record<string, Record<string, unknown>> {
    try {
        return JSON.parse(readFileSync(resolve(process.cwd(), 'tsconfig.json'), 'utf-8'));
    } catch {
        return {compilerOptions: {}};
    }
}
