const path = require('node:path');
const stylelint = require('stylelint');

const {
    createPlugin,
    utils: {report, ruleMessages, validateOptions},
} = stylelint;

const ruleName = '@taiga-ui/relative-less-import-extension';
const messages = ruleMessages(ruleName, {
    expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
});

const meta = {
    fixable: true,
};

function getExpectedExtension(root) {
    const file = root.source && root.source.input && root.source.input.file;

    if (!file) {
        return '.less';
    }

    const ext = path.extname(file).toLowerCase();

    if (ext === '.scss' || ext === '.css' || ext === '.less') {
        return ext;
    }

    return '.less';
}

function hasKnownStyleExtension(value) {
    return /\.(?:less|scss|css)(?:\?.*)?$/i.test(value);
}

function isExternalImport(value) {
    return (
        value.startsWith('@') ||
        value.startsWith('~') ||
        value.startsWith('/') ||
        value.startsWith('//') ||
        /^https?:/i.test(value) ||
        /^data:/i.test(value)
    );
}

function isUrlImport(params) {
    return /^url\(/i.test(params.trim());
}

function isLocalImportPath(value) {
    if (!value) {
        return false;
    }

    if (isExternalImport(value)) {
        return false;
    }

    return true;
}

function splitQueryAndHash(value) {
    const match = value.match(/^([^?#]+)([?#].*)?$/);

    return {
        pathname: match ? match[1] : value,
        suffix: match ? match[2] || '' : '',
    };
}

/** @type {import('stylelint').Rule} */
const ruleFunction = (primary) => (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
    });

    if (!validOptions) {
        return;
    }

    const expectedExtension = getExpectedExtension(root);

    root.walkAtRules('import', (atRule) => {
        const params = atRule.params.trim();

        if (isUrlImport(params)) {
            return;
        }

        const match = params.match(/^(['"])([^'"]+)\1(.*)$/);

        if (!match) {
            return;
        }

        const [, quote, rawImportPath, tail] = match;

        if (!isLocalImportPath(rawImportPath)) {
            return;
        }

        const {pathname, suffix} = splitQueryAndHash(rawImportPath);

        if (hasKnownStyleExtension(pathname)) {
            return;
        }

        const fixedPath = `${pathname}${expectedExtension}${suffix}`;
        const fixedParams = `${quote}${fixedPath}${quote}${tail}`;

        report({
            fix: () => {
                atRule.params = fixedParams;
            },
            message: messages.expected(rawImportPath, fixedPath),
            node: atRule,
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
