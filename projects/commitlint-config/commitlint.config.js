module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': () => {
            function getTypes(dir) {
                try {
                    const {readdirSync, statSync} = require('fs');
                    return readdirSync(dir).filter(entity =>
                        statSync(`${dir}/${entity}`).isDirectory(),
                    );
                } catch {
                    return [];
                }
            }

            return [
                2,
                'always',
                [
                    'deprecate',
                    'schematics',
                    'all',
                    'deps',
                    ...getTypes('projects'),
                    ...getTypes('apps'),
                    ...getTypes('libs'),
                    ...getTypes('packages'),
                ],
            ];
        },
        'type-enum': () => {
            const [level, applicable, types] = require('@commitlint/config-conventional')
                .rules['type-enum'];

            return [level, applicable, [...types, 'deprecate']];
        },
    },
};
