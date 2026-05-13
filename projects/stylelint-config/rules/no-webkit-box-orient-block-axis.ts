import stylelint from 'stylelint';

const {
    createPlugin,
    utils: {report, ruleMessages, validateOptions},
} = stylelint;

const ruleName = '@taiga-ui/no-webkit-box-orient-block-axis';

const messages = ruleMessages(ruleName, {
    expected:
        'Expected "-webkit-box-orient: block-axis" to be "-webkit-box-orient: vertical"',
});

const meta: stylelint.RuleMeta = {
    fixable: true,
    url: 'https://github.com/taiga-family/toolkit/tree/main/projects/stylelint-config',
};

const ruleFunction: stylelint.Rule<boolean, Record<string, never>, typeof messages> =
    (primary) => (root, result) => {
        const validOptions = validateOptions(result, ruleName, {
            actual: primary,
            possible: [true],
        });

        if (!validOptions) {
            return;
        }

        root.walkDecls('-webkit-box-orient', (decl) => {
            if (decl.value.trim().toLowerCase() !== 'block-axis') {
                return;
            }

            report({
                fix: () => {
                    decl.value = 'vertical';
                },
                message: messages.expected,
                node: decl,
                result,
                ruleName,
            });
        });
    };

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

const plugin = Object.assign(createPlugin(ruleName, ruleFunction), {
    messages,
    meta,
    ruleName,
});

export default plugin;
