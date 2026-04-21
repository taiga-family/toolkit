import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../utils/create-rule';

type MessageId = 'useNamespaceKeyword';

type Options = [];

function getModuleKeywordToken(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.TSModuleDeclaration,
): TSESLint.AST.Token | null {
    const firstToken = sourceCode.getFirstToken(node);

    if (!firstToken) {
        return null;
    }

    if (firstToken.value === 'declare') {
        return sourceCode.getTokenAfter(firstToken) ?? null;
    }

    return firstToken;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        return {
            TSModuleDeclaration(node: TSESTree.TSModuleDeclaration) {
                if (
                    node.kind !== 'module' ||
                    node.global ||
                    node.id.type === AST_NODE_TYPES.Literal
                ) {
                    return;
                }

                const moduleKeywordToken = getModuleKeywordToken(sourceCode, node);

                if (moduleKeywordToken?.value !== 'module') {
                    return;
                }

                context.report({
                    fix: (fixer) => fixer.replaceText(moduleKeywordToken, 'namespace'),
                    messageId: 'useNamespaceKeyword',
                    node: moduleKeywordToken,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Prefer `namespace Foo {}` over the older `module Foo {}` syntax for TypeScript namespace declarations.',
        },
        fixable: 'code',
        messages: {
            useNamespaceKeyword:
                'Use `namespace` instead of `module` for TypeScript namespace declarations.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'prefer-namespace-keyword',
});

export default rule;
