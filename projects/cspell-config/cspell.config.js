module.exports = {
    files: ['*/*.*'],
    $schema:
        'https://raw.githubusercontent.com/streetsidesoftware/master/cspell.schema.json',
    caseSensitive: false,
    ignorePaths: [
        '**/LICENSE',
        '**/.github/CODEOWNERS',
        '**/CHANGELOG.md',
        '**/.cspell.json',
        '**/.git/**',
        '**/dist/**',
        '**/cspell/**',
        '**/assets/**',
        '**/.vscode/**',
        '**/node_modules/**',
        '**/*.{log,svg,snap,png,ogv,yml,less,hbs}',
    ],
    ignoreRegExpList: [
        String.raw`\(https?://.*?\)`,
        String.raw`\/{1}.+\/{1}`,
        String.raw`\%2F.+`,
        String.raw`\%2C.+`,
        String.raw`\ɵ.+`,
        String.raw`\ыва.+`,
    ],
    import: [
        './configs/locales/latin.json',
        './configs/locales/dutch.json',
        './configs/locales/arabic.json',
        './configs/locales/ru.json',
        './configs/all.json',
    ],
    language: 'en,ru,ar,lorem',
    useGitignore: true,
};
