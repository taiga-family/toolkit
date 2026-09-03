import {defineConfig} from 'eslint/config';
import jest from 'eslint-plugin-jest';

export default defineConfig([
    {
        files: ['**/*.spec.ts'],
        extends: [jest.configs['flat/recommended']],
        rules: {
            'jest/expect-expect': 'off',
            'jest/max-expects': 'off',
            'jest/max-nested-describe': 'off',
            'jest/no-conditional-in-test': 'off',
            'jest/no-deprecated-functions': 'off',
            'jest/no-disabled-tests': 'off',
            'jest/no-done-callback': 'off',
            'jest/no-hooks': 'off',
            'jest/no-test-prefixes': 'error',
            'jest/prefer-called-with': 'off',
            'jest/prefer-each': 'off',
            'jest/prefer-expect-assertions': 'off',
            'jest/prefer-expect-resolves': 'off',
            'jest/prefer-hooks-on-top': 'off',
            /**
             * If enabled we have
             * Expected to be running in 'ProxyZone', but it was not found
             */
            'jest/prefer-ending-with-an-expect': 'off',
            'jest/prefer-importing-jest-globals': 'off',
            'jest/prefer-lowercase-title': [
                'error',
                {
                    allowedPrefixes: [
                        'Tui',
                        'NaN',
                        'UTC',
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                    ],
                    ignore: ['describe', 'test'],
                },
            ],
            'jest/prefer-strict-equal': 'off',
            'jest/prefer-to-be-null': 'off',
            'jest/prefer-to-have-length': 'off',
            'jest/require-hook': 'off',
            'jest/require-to-throw-message': 'off',
            'jest/require-top-level-describe': [
                'error',
                {maxNumberOfTopLevelDescribes: 1},
            ],
            'jest/unbound-method': 'off',
            'jest/valid-title': 'off',
        },
    },
]);
