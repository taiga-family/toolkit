import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

type MessageId = 'useWithImportAttributes';

type Options = [];

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        return {
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const importAttributesToken = sourceCode.getTokenAfter(node.source);

                if (importAttributesToken?.value !== 'assert') {
                    return;
                }

                context.report({
                    fix: (fixer) => fixer.replaceText(importAttributesToken, 'with'),
                    messageId: 'useWithImportAttributes',
                    node: importAttributesToken,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow legacy `assert { ... }` import assertions. Use `with { ... }` import attributes instead.',
        },
        fixable: 'code',
        messages: {
            useWithImportAttributes:
                'Use `with { ... }` import attributes instead of `assert { ... }`.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-import-assertions',
});

export default rule;
