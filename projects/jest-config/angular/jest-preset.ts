import {resolve} from 'node:path';

import {type JestConfigWithTsJest} from 'ts-jest';

import {tuiBaseJestConfig} from '../base.ts';

/**
 * Jest preset for Angular projects.
 *
 * Relies on `jest-preset-angular` (+ jsdom, zone.js, resize-observer-polyfill),
 * which are declared as optional peer dependencies of `@taiga-ui/jest-config`.
 */
export default {
    ...tuiBaseJestConfig,
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: [
        '<rootDir>/node_modules/@taiga-ui/jest-config/angular/polyfill.js',
    ],
    testEnvironment: 'jsdom',
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
        'node_modules/(?!@angular|rxjs|ngx-highlightjs|@ngrx|@maskito|parse5|@ng-web-apis|@taiga-ui|vscode-.+).+',
    ],
} satisfies JestConfigWithTsJest;

declare const global: (Record<any, any> & Window) | undefined;

export function tuiSwitchNgDevMode(enable: boolean): void {
    if (global) {
        global.ngDevMode = enable;
    }
}
