import type {Linter} from 'eslint';

export const TUI_RECOMMENDED_NAMING_CONVENTION: Linter.RuleEntry = [
    'error',
    {
        format: ['PascalCase', 'UPPER_CASE'],
        selector: 'typeLike',
    },
    {
        format: ['PascalCase'],
        modifiers: ['exported'],
        selector: 'class',
    },
    {
        format: ['PascalCase'],
        modifiers: ['exported', 'abstract'],
        selector: 'class',
    },
    {
        format: ['camelCase'],
        modifiers: ['exported'],
        selector: 'function',
    },
    {
        format: ['PascalCase'],
        modifiers: ['exported'],
        selector: 'interface',
    },
    {
        format: ['PascalCase'],
        modifiers: ['exported'],
        selector: 'typeAlias',
    },
    {
        format: null,
        modifiers: ['destructured'],
        selector: 'variable',
    },
    {
        filter: '__non_webpack_require__',
        format: null,
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
    {
        format: ['camelCase'],
        selector: 'classMethod',
    },
    {
        format: ['camelCase', 'UPPER_CASE'],
        selector: 'classProperty',
    },
];

export const TUI_CUSTOM_TAIGA_NAMING_CONVENTION: Linter.RuleEntry = [
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
];
