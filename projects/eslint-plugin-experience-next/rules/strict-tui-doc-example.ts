import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {getTypeName} from './utils/get-type-name';

const INVALID_KEY_MESSAGE_ID = 'strict-doc-example-extensions-invalid-key' as const;
const INVALID_VALUE_MESSAGE_ID = 'strict-doc-example-extensions-invalid-value' as const;

const DOC_EXAMPLE_INTERFACE_NAME = 'TuiDocExample';

const fileNameToExtension: Record<string, string> = {
    CSS: '.css',
    HTML: '.html',
    JavaScript: '.md',
    LESS: '.less',
    TypeScript: '.ts',
};

/**
 * Разбивает путь на группы:
 * 1. Всё до последнего расширения (жадно)
 * 2. Расширение
 * 3. Всё после расширения (например, `?raw`)
 *
 * @example
 * getPathGroups(`./examples/2/index.html/index.ts?raw`)
 * // -> ['...', '.ts', '?raw']
 */
function getPathGroups(path: string): RegExpMatchArray | null {
    return /(.+)(\.(?:ts|less|scss|js|md|css|html))(.*)/.exec(path);
}

type MessageIds = typeof INVALID_KEY_MESSAGE_ID | typeof INVALID_VALUE_MESSAGE_ID;

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule<
    [], // опций нет
    MessageIds
>({
    create(context) {
        return {
            'PropertyDefinition[value.type="ObjectExpression"]'(
                node: TSESTree.PropertyDefinition,
            ) {
                if (getTypeName(node) !== DOC_EXAMPLE_INTERFACE_NAME) {
                    return;
                }

                const obj = node.value as TSESTree.ObjectExpression;

                for (const prop of obj.properties) {
                    if (prop.type !== AST_NODE_TYPES.Property) {
                        continue;
                    }

                    let key = '';

                    if (prop.key.type === AST_NODE_TYPES.Identifier) {
                        key = prop.key.name;
                    } else if (prop.key.type === AST_NODE_TYPES.Literal) {
                        key = String(prop.key.value);
                    }

                    const value = prop.value;

                    if (value.type !== AST_NODE_TYPES.ImportExpression) {
                        continue;
                    }

                    const source = value.source;

                    const sourceValue =
                        source.type === AST_NODE_TYPES.Literal &&
                        typeof source.value === 'string'
                            ? source.value
                            : '';

                    const expectedExtension =
                        fileNameToExtension[key] || getPathGroups(key)?.[2];

                    const actualGroups = getPathGroups(sourceValue) ?? [];
                    const [, beforeExt, actualExt, afterExt] = actualGroups;

                    const mismatchExtensions =
                        !expectedExtension ||
                        !actualGroups.length ||
                        expectedExtension !== actualExt;

                    if (!mismatchExtensions) {
                        continue;
                    }

                    const invalidNode = expectedExtension ? source : prop.key;
                    const messageId = expectedExtension
                        ? INVALID_VALUE_MESSAGE_ID
                        : INVALID_KEY_MESSAGE_ID;

                    context.report({
                        fix(fixer) {
                            if (expectedExtension && actualGroups.length) {
                                const fixedValue = `'${beforeExt}${expectedExtension}${afterExt}'`;

                                return fixer.replaceText(source, fixedValue);
                            }

                            return null;
                        },
                        messageId,
                        node: invalidNode,
                    });
                }
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description: `Ensures that keys and values are valid in a ${DOC_EXAMPLE_INTERFACE_NAME} interface.`,
        },
        fixable: 'code',
        messages: {
            [INVALID_KEY_MESSAGE_ID]:
                'The value must be either a valid path with an extension or an abstract file name.',
            [INVALID_VALUE_MESSAGE_ID]:
                'The import path extension must match the extension from the object key.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'strict-doc-example-extensions',
});

export default rule;
