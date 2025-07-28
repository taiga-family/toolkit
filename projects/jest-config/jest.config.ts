/// <reference lib="es2021" />
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

import type {JestConfigWithTsJest} from 'ts-jest';
import {pathsToModuleNameMapper} from 'ts-jest';

process.env.TZ = 'Europe/Moscow';
process.env.FORCE_COLOR = 'true';
process.env.TS_JEST_DISABLE_VER_CHECKER = 'true';

const {compilerOptions} = require(resolve(process.cwd(), 'tsconfig.json'));
const maxParallel = require('node:os').cpus().length / 2;

const setupJestFile = resolve(
    process.cwd(),
    './node_modules/@taiga-ui/testing/setup-jest/index.ts',
);

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
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
        prefix: `<rootDir>/${compilerOptions.baseUrl}/`
            .replaceAll('./', '/')
            .replaceAll(/\/\/+/g, '/'),
    }),
    modulePathIgnorePatterns: ['.cache', 'dist', '<rootDir>/dist/'],
    passWithNoTests: true,
    preset: 'jest-preset-angular',
    reporters: ['default'],
    rootDir: process.cwd(),
    setupFiles: [require.resolve('./polyfill')],
    setupFilesAfterEnv: existsSync(setupJestFile)
        ? [resolve(process.cwd(), './node_modules/@taiga-ui/testing/setup-jest/index.ts')]
        : [],
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
            require.resolve('jest-preset-angular'),
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
