import {ESLintUtils} from '@typescript-eslint/utils';

export const ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL =
    'https://angular.dev/guide/signals#reading-without-tracking-dependencies';
export const ANGULAR_SIGNALS_ASYNC_GUIDE_URL =
    'https://angular.dev/guide/signals#reactive-context-and-async-operations';
export const UNTRACKED_RULES_README_URL =
    'https://github.com/taiga-family/taiga-ui/blob/main/projects/eslint-plugin-experience-next/README.md';

export const createUntrackedRule = ESLintUtils.RuleCreator(
    (name) => `${UNTRACKED_RULES_README_URL}#${name}`,
);
