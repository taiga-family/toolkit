const stylelint = require('stylelint');

const {
    createPlugin,
    utils: {report, ruleMessages, validateOptions},
} = stylelint;

const ruleName = '@taiga-ui/no-webkit-box-orient-block-axis';
const messages = ruleMessages(ruleName, {
    expected:
        'Expected "-webkit-box-orient: block-axis" to be "-webkit-box-orient: vertical"',
});

const meta = {
    fixable: true,
};

/** @type {import('stylelint').Rule} */
const ruleFunction = (primary) => (root, result) => {
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

module.exports = createPlugin(ruleName, ruleFunction);
module.exports.ruleName = ruleName;
module.exports.messages = messages;
module.exports.meta = meta;
