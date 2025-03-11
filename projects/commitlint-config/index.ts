import conventional from '@commitlint/config-conventional';

import {getGitDiffLines} from './utils/get-git-diff-lines';
import {getTypes} from './utils/get-types';

export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': () => {
            return [
                2,
                'always',
                [
                    'release',
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
            const staged = getGitDiffLines();
            const demoChanges = staged.filter(
                (path) =>
                    path.startsWith('projects/demo') || path.startsWith('apps/demo'),
            );

            const [level, applicable, types] = conventional.rules['type-enum'];
            const prefixes =
                demoChanges.length === staged.length
                    ? ['chore']
                    : [...types, 'deprecate'];

            return [level, applicable, prefixes];
        },
    },
};
