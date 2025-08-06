import {type Rule} from 'eslint';

const config: Rule.RuleModule = {
    create(context) {
        return {
            ClassDeclaration: function reportUnwantedName(node) {
                const members = Array.from(node.body.body);

                members.forEach((member) => {
                    if ((member as any)?.key?.type === 'PrivateIdentifier') {
                        context.report({
                            message: `Please don't use "#${(member as any)?.key?.name}" instead of "private ${(member as any)?.key?.name}"`,
                            node,
                        });
                    }
                });
            },
        };
    },
    meta: {
        fixable: 'code',
        type: 'problem',
    },
};

export default config;
