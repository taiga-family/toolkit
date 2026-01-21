import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const MESSAGE_ID = 'invalid-injection-token-description' as const;
const ERROR_MESSAGE = "InjectionToken's description should contain token's name";

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
    create(context) {
        return {
            'NewExpression[callee.name="InjectionToken"]'(node?: TSESTree.NewExpression) {
                let token: string | undefined;
                let name: string | undefined;

                const [description] = node?.arguments || [];

                if (!description) {
                    return;
                }

                const isLiteral =
                    description.type === AST_NODE_TYPES.Literal &&
                    typeof description.value === 'string';

                if (isLiteral) {
                    token = description.value;
                }

                if (description.type === AST_NODE_TYPES.TemplateLiteral) {
                    token = description.quasis[0]?.value.raw || '';
                }

                if (node?.parent.type === AST_NODE_TYPES.VariableDeclarator) {
                    const id = node.parent.id;

                    if (id.type === AST_NODE_TYPES.Identifier) {
                        name = id.name;
                    }
                }

                const report = name && token && !token.includes(name);

                if (report) {
                    context.report({
                        fix: (fixer) => {
                            const [start, end] = description.range;

                            return fixer.insertTextBeforeRange(
                                [start + 1, end],
                                `[${name}]: `,
                            );
                        },
                        messageId: MESSAGE_ID,
                        node: description,
                    });
                }
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [],
        type: 'problem',
    },
    name: 'injection-token-description',
});

export default rule;
