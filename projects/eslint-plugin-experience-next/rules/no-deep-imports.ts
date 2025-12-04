import path from 'node:path';

import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const MESSAGE_ID = 'no-deep-imports' as const;
const ERROR_MESSAGE = 'Deep imports of Taiga UI packages are prohibited';

const DEFAULT_OPTIONS = {
    currentProject: '',
    deepImport: String.raw`(?<=^@taiga-ui/[\w-]+)(/.+)$`,
    ignoreImports: [] as string[],
    importDeclaration: '^@taiga-ui*',
    projectName: String.raw`(?<=^@taiga-ui/)([-\w]+)`,
};

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
    create(context) {
        const {
            currentProject,
            deepImport,
            ignoreImports,
            importDeclaration,
            projectName,
        } = {...DEFAULT_OPTIONS, ...context.options[0]};

        const isDeepImport = (source?: string): boolean =>
            !!source && new RegExp(deepImport, 'g').test(source);

        const isInsideTheSameEntryPoint = (source?: string): boolean => {
            const filePath = path
                .relative(context.cwd, context.filename)
                .replaceAll(/\\+/g, '/');

            const [currentFileProjectName] =
                (currentProject && new RegExp(currentProject, 'g').exec(filePath)) || [];

            const [importSourceProjectName] =
                source?.match(new RegExp(projectName, 'g')) || [];

            return Boolean(
                currentFileProjectName &&
                importSourceProjectName &&
                currentFileProjectName === importSourceProjectName,
            );
        };

        const shouldIgnore = (source?: string): boolean =>
            !!source && ignoreImports.some((p) => new RegExp(p, 'g').test(source));

        return {
            [`ImportDeclaration[source.value=/${importDeclaration}/]`](
                node?: TSESTree.ImportDeclaration,
            ) {
                const importSource = node?.source.value;

                if (
                    !node ||
                    !importSource ||
                    !isDeepImport(importSource) ||
                    isInsideTheSameEntryPoint(importSource) ||
                    shouldIgnore(importSource)
                ) {
                    return;
                }

                context.report({
                    fix: (fixer) => {
                        const [start, end] = node.source.range;

                        return fixer.replaceTextRange(
                            [start + 1, end - 1], // keep quotes
                            importSource.replaceAll(new RegExp(deepImport, 'g'), ''),
                        );
                    },
                    messageId: MESSAGE_ID,
                    node: node.source,
                });
            },
        };
    },
    defaultOptions: [DEFAULT_OPTIONS],
    meta: {
        docs: {
            description: ERROR_MESSAGE,
        },
        fixable: 'code',
        messages: {
            [MESSAGE_ID]: ERROR_MESSAGE,
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    currentProject: {
                        description:
                            'RegExp string to pick out current project name of processed file',
                        type: 'string',
                    },
                    deepImport: {
                        description: 'RegExp string to pick out deep import part',
                        type: 'string',
                    },
                    ignoreImports: {
                        description:
                            'RegExp string to exclude import declarations which is selected by importDeclaration-option',
                        items: {type: 'string'},
                        type: 'array',
                    },
                    importDeclaration: {
                        description:
                            'RegExp string to detect import declarations for which this rule should be applied',
                        type: 'string',
                    },
                    projectName: {
                        description: 'RegExp string to extract project name from import',
                        type: 'string',
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'no-deep-imports',
});

export default rule;
