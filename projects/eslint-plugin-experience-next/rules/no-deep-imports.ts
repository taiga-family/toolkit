import path from 'node:path';

import {type Rule} from 'eslint';

const MESSAGE_ID = 'no-deep-imports';
const ERROR_MESSAGE = 'Deep imports of Taiga UI packages are prohibited';

const DEFAULT_OPTIONS = {
    currentProject: '',
    deepImport: String.raw`(?<=^@taiga-ui/[\w-]+)(/.+)$`,
    ignoreImports: [],
    importDeclaration: '^@taiga-ui*',
    projectName: String.raw`(?<=^@taiga-ui/)([-\w]+)`,
};

const config: Rule.RuleModule = {
    create(context) {
        const {
            currentProject,
            deepImport,
            ignoreImports,
            importDeclaration,
            projectName,
        } = {
            ...DEFAULT_OPTIONS,
            ...(context.options[0] || {}),
        };

        const isDeepImport = (source: string): boolean =>
            !!source.match(new RegExp(deepImport, 'g'))?.length;

        const isInsideTheSameEntryPoint = (source: string): boolean => {
            const filePath = path
                .relative(context.cwd, context.filename)
                .replaceAll(/\\+/g, '/');

            const [currentFileProjectName] =
                (currentProject && new RegExp(currentProject, 'g').exec(filePath)) || [];
            const [importSourceProjectName] =
                source.match(new RegExp(projectName, 'g')) || [];

            return Boolean(
                currentFileProjectName &&
                    importSourceProjectName &&
                    currentFileProjectName === importSourceProjectName,
            );
        };

        const shouldIgnore = (source: string): boolean =>
            ignoreImports.some((p: string) => source.match(new RegExp(p, 'g')));

        return {
            [`ImportDeclaration[source.value=/${importDeclaration}/]`]({
                source: sourceNode,
            }) {
                const importSource = sourceNode?.value || '';

                if (
                    !isDeepImport(importSource) ||
                    isInsideTheSameEntryPoint(importSource) ||
                    shouldIgnore(importSource)
                ) {
                    return;
                }

                context.report({
                    fix: (fixer) => {
                        const [start, end] = sourceNode.range;

                        return fixer.replaceTextRange(
                            [start + 1, end - 1], //  keeps quotes
                            importSource.replaceAll(new RegExp(deepImport, 'g'), ''),
                        );
                    },
                    messageId: MESSAGE_ID,
                    node: sourceNode,
                });
            },
        };
    },
    meta: {
        docs: {description: ERROR_MESSAGE},
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
                        items: {
                            type: 'string',
                        },
                        type: 'array',
                    },
                    importDeclaration: {
                        description:
                            'RegExp string to detect import declarations for which this rule should be applied',
                        type: 'string',
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
};

export default config;
