import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../utils/create-rule';

type MessageId = 'avoidCallableNamespaceImport' | 'avoidImportEquals';

type Options = [];

interface NamespaceImportUsage {
    readonly node: TSESTree.ImportNamespaceSpecifier;
    readonly variable: TSESLint.Scope.Variable;
    usedLikeValue: boolean;
}

function getResolvedVariable(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Identifier,
): TSESLint.Scope.Variable | null {
    const scope = sourceCode.getScope(node);
    const reference = scope.references.find((item) => item.identifier === node);

    return reference?.resolved ?? null;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;
        const namespaceImports = new Map<string, NamespaceImportUsage>();

        const markNamespaceImportAsUsedLikeValue = (
            identifier: TSESTree.Identifier,
        ): void => {
            const usage = namespaceImports.get(identifier.name);

            if (
                !usage ||
                usage.usedLikeValue ||
                getResolvedVariable(sourceCode, identifier) !== usage.variable
            ) {
                return;
            }

            usage.usedLikeValue = true;
        };

        return {
            'CallExpression > Identifier.callee'(node: TSESTree.Identifier) {
                markNamespaceImportAsUsedLikeValue(node);
            },

            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const namespaceImport = node.specifiers.find(
                    (specifier): specifier is TSESTree.ImportNamespaceSpecifier =>
                        specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
                );

                if (!namespaceImport) {
                    return;
                }

                const [variable] = sourceCode.getDeclaredVariables(namespaceImport);

                if (!variable) {
                    return;
                }

                namespaceImports.set(namespaceImport.local.name, {
                    node: namespaceImport,
                    usedLikeValue: false,
                    variable,
                });
            },

            'NewExpression > Identifier.callee'(node: TSESTree.Identifier) {
                markNamespaceImportAsUsedLikeValue(node);
            },

            'Program:exit'() {
                for (const usage of namespaceImports.values()) {
                    if (!usage.usedLikeValue) {
                        continue;
                    }

                    context.report({
                        data: {name: usage.node.local.name},
                        messageId: 'avoidCallableNamespaceImport',
                        node: usage.node,
                    });
                }
            },

            'TaggedTemplateExpression > Identifier.tag'(node: TSESTree.Identifier) {
                markNamespaceImportAsUsedLikeValue(node);
            },

            TSImportEqualsDeclaration(node: TSESTree.TSImportEqualsDeclaration) {
                if (
                    node.moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference
                ) {
                    return;
                }

                context.report({
                    data: {name: node.id.name},
                    messageId: 'avoidImportEquals',
                    node,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow legacy CommonJS interop import patterns such as `import = require(...)` and namespace imports used like callable values.',
        },
        messages: {
            avoidCallableNamespaceImport:
                'Namespace import "{{name}}" is used like a value instead of a namespace. This is a brittle interop pattern and often should become a default import.',
            avoidImportEquals:
                '`import {{name}} = require(...)` is a legacy CommonJS import pattern.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-commonjs-import-patterns',
});

export default rule;
