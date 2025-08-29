export const TUI_RECOMMENDED_NAMING_CONVENTION = [
    {
        format: ['PascalCase', 'UPPER_CASE'],
        selector: 'typeLike',
    },
    {
        format: ['PascalCase'],
        selector: 'class',
    },
    {
        format: ['PascalCase'],
        modifiers: ['abstract'],
        selector: 'class',
    },
    {
        format: ['camelCase'],
        selector: 'function',
    },
    {
        format: ['PascalCase'],
        selector: 'interface',
    },
    {
        format: ['PascalCase'],
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
        selector: 'variable',
    },
    {
        format: ['PascalCase'],
        modifiers: ['abstract'],
        selector: 'class',
    },
    {
        format: ['StrictPascalCase'],
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
] as const;

export const TUI_CUSTOM_TAIGA_NAMING_CONVENTION = [
    {
        format: ['PascalCase', 'UPPER_CASE'],
        selector: 'typeLike',
    },
    {
        format: ['PascalCase'],
        prefix: ['Tui'],
        selector: 'class',
    },
    {
        format: ['PascalCase'],
        modifiers: ['abstract'],
        prefix: ['AbstractTui', 'Tui'],
        selector: 'class',
    },
    {
        format: ['PascalCase'],
        prefix: ['tui'],
        selector: 'function',
    },
    {
        format: ['PascalCase'],
        prefix: ['Tui'],
        selector: 'interface',
    },
    {
        format: ['PascalCase'],
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
] as const;
