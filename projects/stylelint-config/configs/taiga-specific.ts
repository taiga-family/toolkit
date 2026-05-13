import {type Config} from 'stylelint';

type StylelintConfig = Config & {
    readonly $schema: string;
};

const config: StylelintConfig = {
    $schema:
        'https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/stylelintrc.json',
    rules: {
        'custom-property-pattern': [
            '^(tui|t|docsearch)-([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
            {
                message: 'Expected custom property name to be kebab-case',
                severity: 'error',
            },
        ],
    },
};

export default config;
