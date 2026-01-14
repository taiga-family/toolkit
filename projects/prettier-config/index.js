const attributeOptions = {
    attributeGroups: [
        '$ANGULAR_STRUCTURAL_DIRECTIVE',
        '$ANGULAR_ELEMENT_REF',
        '$ID',
        '$DEFAULT',
        '$CLASS',
        '$ANGULAR_ANIMATION',
        '$ANGULAR_ANIMATION_INPUT',
        '$ANGULAR_INPUT',
        '$ANGULAR_TWO_WAY_BINDING',
        '$ANGULAR_OUTPUT',
    ],
    attributeSort: 'ASC',
};

module.exports = {
    $schema: 'https://json.schemastore.org/prettierrc',
    plugins: [
        require.resolve('stylelint-prettier'),
        require.resolve('prettier-plugin-organize-attributes'),
    ],
    arrowParens: 'always',
    bracketSpacing: false,
    endOfLine: 'lf',
    htmlWhitespaceSensitivity: 'ignore',
    printWidth: 120,
    proseWrap: 'always',
    semi: true,
    singleAttributePerLine: true,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'all',
    useTabs: false,
    overrides: [
        {
            files: ['*.json'],
            options: {
                parser: 'json',
            },
        },
        {
            files: ['package-lock.json'],
            options: {
                parser: 'json-stringify',
            },
        },
        {
            files: ['package.json', 'ng-package.json'],
            options: {
                parser: 'json-stringify',
                plugins: [
                    require.resolve(
                        require('node:path').resolve(
                            __dirname,
                            'plugins',
                            'prettier-plugin-sort-package.js',
                        ),
                    ),
                ],
            },
        },
        {
            files: ['*.less'],
            options: {parser: 'less'},
        },
        {
            files: ['*.scss'],
            options: {parser: 'scss'},
        },
        {
            files: ['*.xml'],
            options: {
                parser: 'xml',
                plugins: [require.resolve('@prettier/plugin-xml')],
            },
        },
        {
            files: ['*.yml', '*.yaml'],
            options: {parser: 'yaml', tabWidth: 2},
        },
        {
            files: ['*.md'],
            options: {parser: 'markdown', tabWidth: 2},
        },
        {
            files: ['*.html'],
            options: {
                parser: 'angular',
                printWidth: 120,
                ...attributeOptions,
            },
        },
        {
            files: ['*.js', '*.ts'],
            options: {
                ...attributeOptions,
                parser: 'typescript',
                printWidth: 90,
            },
        },
        {
            files: '*.svg',
            options: require(
                require('node:path').resolve(__dirname, 'options', 'svg.js'),
            ),
        },
    ],
};
