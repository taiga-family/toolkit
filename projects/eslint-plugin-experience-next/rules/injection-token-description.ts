import {type Rule} from 'eslint';

const MESSAGE_ID = 'invalid-injection-token-description';
const ERROR_MESSAGE = "InjectionToken's description should contain token's name";

const config: Rule.RuleModule = {
    create(context) {
        return {
            'NewExpression[callee.name="InjectionToken"]': (node) => {
                const [tokenDescriptionNode] = node.arguments || [];
                const tokenDescription =
                    tokenDescriptionNode.value || // simple string
                    tokenDescriptionNode.quasis?.[0].value?.raw || // TemplateLiteral (backtick string)
                    '';
                const tokenName = node.parent.id?.name;
                const hasReport =
                    tokenName &&
                    tokenDescription &&
                    !tokenDescription.includes(tokenName);

                if (hasReport) {
                    context.report({
                        fix: (fixer) => {
                            const [start, end] = tokenDescriptionNode.range;

                            return fixer.insertTextBeforeRange(
                                [start + 1, end],
                                `[${tokenName}]: `,
                            );
                        },
                        messageId: MESSAGE_ID,
                        node: tokenDescriptionNode,
                    });
                }
            },
        };
    },
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {
            [MESSAGE_ID]: ERROR_MESSAGE,
        },
        type: 'problem',
    },
};

export default config;
