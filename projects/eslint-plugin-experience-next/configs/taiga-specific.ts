import {readFileSync} from 'node:fs';

import {globSync} from 'glob';
import tseslint from 'typescript-eslint';

import {
    TUI_CUSTOM_TAIGA_NAMING_CONVENTION,
    TUI_RECOMMENDED_NAMING_CONVENTION,
} from '../rules/convention';

const allPackageJSONs = globSync('**/package.json', {
    ignore: ['node_modules/**', 'dist/**'],
}).filter((path) => !readJSON(path).private);
const packageNames = allPackageJSONs.map((path) => readJSON(path).name).filter(Boolean);

// Normalize Windows path separators to POSIX for ESLint file pattern matching
const packageSourceGlobs = allPackageJSONs.map((p) => p.replace(/\\+/g, '/').replace('package.json', '**/*.ts'));

export default tseslint.config([
    {
        files: packageSourceGlobs,
        ignores: ['**/*.spec.ts', '**/*.cy.ts'],
        rules: {
            '@taiga-ui/experience-next/no-deep-imports': 'off',
            '@taiga-ui/experience-next/prefer-deep-imports': [
                'error',
                {
                    importFilter: packageNames,
                },
            ],
        },
    },
    {
        files: ['**/*.ts'],
        rules: {
            '@taiga-ui/experience-next/array-as-const': 'error',
            '@taiga-ui/experience-next/class-property-naming': [
                'error',
                [
                    {
                        fieldNames: ['element'],
                        newFieldName: 'el',
                        withTypesSpecifier: ['Element'],
                    },
                    {
                        fieldNames: ['window'],
                        newFieldName: 'win',
                        withTypesSpecifier: ['Window'],
                    },
                    {
                        fieldNames: ['document'],
                        newFieldName: 'doc',
                        withTypesSpecifier: ['Document'],
                    },
                ],
            ],
            '@taiga-ui/experience-next/strict-tui-doc-example': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                ...TUI_CUSTOM_TAIGA_NAMING_CONVENTION,
            ],
        },
    },
    {
        files: [
            '**/projects/*demo*/**/*.ts',
            '**/scripts/**/*.ts',
            '**/schematics/**/*.ts',
            '**/apps/**/*.ts',
        ],
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                ...TUI_RECOMMENDED_NAMING_CONVENTION,
            ],
        },
    },
]);

function readJSON(path: string): Record<string, unknown> {
    try {
        return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
        return {};
    }
}
