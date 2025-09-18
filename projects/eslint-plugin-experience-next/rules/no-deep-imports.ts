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
            // Use official ESLint API getters to ensure cross-platform correctness (context.cwd is not public)
            const filePath = path
                .relative(context.getCwd(), context.getFilename())
                .replaceAll(/\\+/g, '/');

            let [currentFileProjectName] =
                (currentProject && new RegExp(currentProject, 'g').exec(filePath)) || [];

            // Fallback: derive project name from conventional monorepo path structure `projects/<name>/...`
            if (!currentFileProjectName) {
                const fallback = /projects\/([\w-]+)\//.exec(filePath)?.[1];
                if (fallback) {
                    currentFileProjectName = fallback;
                }
            }

            const [importSourceProjectName] =
                source.match(new RegExp(projectName, 'g')) || [];

            if (
                currentFileProjectName &&
                importSourceProjectName &&
                currentFileProjectName === importSourceProjectName
            ) {
                return true;
            }

            // Additional safeguard: compare the base package segment extracted from import with derived project name
            // Example: import '@taiga-ui/cdk/directives/animated' -> basePackage '@taiga-ui/cdk'
            const basePackageMatch = /^(@[^/]+\/[\w-]+)/.exec(source)?.[1];
            if (basePackageMatch && currentFileProjectName) {
                // Map project name to expected scoped package name form
                const expectedBase = `@taiga-ui/${currentFileProjectName}`;
                if (basePackageMatch === expectedBase) {
                    return true;
                }
            }

            return false;
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
