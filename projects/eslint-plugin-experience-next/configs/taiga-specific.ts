import {readFileSync} from 'node:fs';

import {globSync} from 'glob';
import tseslint from 'typescript-eslint';

const allPackageJSONs = globSync('**/package.json', {
    ignore: ['node_modules/**', 'dist/**'],
}).filter((path) => !readJSON(path).private);
const packageNames = allPackageJSONs.map((path) => readJSON(path).name).filter(Boolean);

export default tseslint.config([
    {
        files: allPackageJSONs.map((path) => path.replace('package.json', '**/*.ts')),
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
            '@taiga-ui/experience-next/strict-tui-doc-example': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    format: ['PascalCase', 'UPPER_CASE'],
                    selector: 'typeLike',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    prefix: ['Tui'],
                    selector: 'class',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported', 'abstract'],
                    prefix: ['AbstractTui', 'Tui'],
                    selector: 'class',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    prefix: ['tui'],
                    selector: 'function',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    prefix: ['Tui'],
                    selector: 'interface',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    prefix: ['Tui'],
                    selector: 'typeAlias',
                },
                {
                    format: null,
                    modifiers: ['destructured'],
                    selector: 'variable',
                },
                {
                    format: ['camelCase'],
                    selector: 'variable',
                },
                {
                    format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
                    modifiers: ['global'],
                    selector: 'variable',
                },
                {
                    format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
                    modifiers: ['exported'],
                    selector: 'variable',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['abstract'],
                    prefix: ['AbstractTui', 'Tui'],
                    selector: 'class',
                },
                {
                    format: ['StrictPascalCase'],
                    modifiers: ['exported'],
                    prefix: ['Tui'],
                    selector: 'enum',
                },
                {
                    format: ['PascalCase'],
                    selector: 'enumMember',
                },
                {
                    format: ['camelCase'],
                    selector: 'classMethod',
                },
                {
                    format: ['camelCase'],
                    selector: 'classProperty',
                },
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
                {
                    format: ['PascalCase', 'UPPER_CASE'],
                    selector: 'typeLike',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    selector: 'typeAlias',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    selector: 'class',
                },
                {
                    format: ['camelCase'],
                    modifiers: ['exported'],
                    selector: 'function',
                },
                {
                    filter: 'updateTo',
                    format: null,
                    selector: 'function',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['exported'],
                    selector: 'interface',
                },
                {
                    filter: '__non_webpack_require__',
                    format: null,
                    selector: 'variable',
                },
                {
                    format: null,
                    modifiers: ['destructured'],
                    selector: 'variable',
                },
                {
                    format: ['camelCase', 'UPPER_CASE'],
                    selector: 'variable',
                },
                {
                    format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
                    modifiers: ['global'],
                    selector: 'variable',
                },
                {
                    format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
                    modifiers: ['exported'],
                    selector: 'variable',
                },
                {
                    format: ['PascalCase'],
                    modifiers: ['abstract'],
                    prefix: ['Abstract', 'Example'],
                    selector: 'class',
                },
                {
                    format: ['StrictPascalCase'],
                    modifiers: ['exported'],
                    selector: 'enum',
                },
                {
                    format: ['PascalCase'],
                    selector: 'enumMember',
                },
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
