export const TUI_RECOMMENDED_NAMING_CONVENTION = [
    {
        format: ['PascalCase'],
        selector: ['class', 'interface', 'typeAlias', 'typeLike', 'enum', 'enumMember'],
    },
    {
        format: ['camelCase'],
        selector: ['classMethod', 'function', 'classProperty'],
    },
    {
        format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
        selector: ['variable'],
    },
    {
        filter: '__non_webpack_require__',
        format: null,
        selector: 'variable',
    },
] as const;

export const TUI_CUSTOM_TAIGA_NAMING_CONVENTION = [
    ...TUI_RECOMMENDED_NAMING_CONVENTION,
    {
        format: ['PascalCase'],
        modifiers: ['exported'],
        prefix: ['Tui', 'AbstractTui'],
        selector: ['class', 'interface', 'typeAlias', 'typeLike', 'enum'],
    },
    {
        format: ['PascalCase'],
        modifiers: ['exported'],
        prefix: ['tui'],
        selector: 'function',
    },
] as const;
