import {extname} from 'node:path';

import stylelint from 'stylelint';

const {
    createPlugin,
    utils: {report, ruleMessages, validateOptions},
} = stylelint;

const ruleName = '@taiga-ui/relative-less-import-extension';

const messages = ruleMessages(ruleName, {
    expected: (actual: string, expected: string) =>
        `Expected "${actual}" to be "${expected}"`,
});

const meta: stylelint.RuleMeta = {
    fixable: true,
    url: 'https://github.com/taiga-family/toolkit/tree/main/projects/stylelint-config',
};

interface RootWithSourceFile {
    readonly source?: {
        readonly input: {
            readonly file?: string;
        };
    };
}

function getExpectedExtension(root: RootWithSourceFile): string {
    const file = root.source?.input.file;

    if (!file) {
        return '.less';
    }

    const ext = extname(file).toLowerCase();

    return ext === '.scss' || ext === '.css' || ext === '.less' ? ext : '.less';
}

function hasKnownStyleExtension(value: string): boolean {
    return /\.(?:less|scss|css)(?:\?.*)?$/i.test(value);
}

function isExternalImport(value: string): boolean {
    return (
        value.startsWith('@') ||
        value.startsWith('~') ||
        value.startsWith('/') ||
        value.startsWith('//') ||
        /^https?:/i.test(value) ||
        /^data:/i.test(value)
    );
}

function isUrlImport(params: string): boolean {
    return /^url\(/i.test(params.trim());
}

function isLocalImportPath(value: string): boolean {
    if (!value || isExternalImport(value)) {
        return false;
    }

    return true;
}

function splitQueryAndHash(value: string): {
    readonly pathname: string;
    readonly suffix: string;
} {
    const match = /^([^?#]+)([?#].*)?$/.exec(value);

    return {
        pathname: match?.[1] ?? value,
        suffix: match?.[2] ?? '',
    };
}

const ruleFunction: stylelint.Rule<boolean, Record<string, never>, typeof messages> =
    (primary) => (root, result) => {
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

            const match = /^(['"])([^'"]+)\1(.*)$/.exec(params);

            if (!match) {
                return;
            }

            const quote = match[1];
            const rawImportPath = match[2];
            const tail = match[3] ?? '';

            if (!quote || !rawImportPath || !isLocalImportPath(rawImportPath)) {
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

const plugin = Object.assign(createPlugin(ruleName, ruleFunction), {
    messages,
    meta,
    ruleName,
});

export default plugin;
