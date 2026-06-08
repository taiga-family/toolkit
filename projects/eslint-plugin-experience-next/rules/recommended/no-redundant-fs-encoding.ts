import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {removeCommaSeparatedNode} from '../utils/ast/comma-separated';
import {
    getMemberExpressionPropertyName,
    getObjectPropertyName,
} from '../utils/ast/property-names';
import {getStaticStringValue} from '../utils/ast/string-literals';
import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'noRedundantFsEncoding';

const WRITE_METHODS = new Set([
    'appendFile',
    'appendFileSync',
    'writeFile',
    'writeFileSync',
]);

const FS_NAMESPACE_NAMES = new Set(['fs', 'fsPromises']);

function isWriteMethod(name: string | null): boolean {
    return name !== null && WRITE_METHODS.has(name);
}

function isFsNamespaceObject(node: TSESTree.MemberExpression['object']): boolean {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return FS_NAMESPACE_NAMES.has(node.name);
    }

    if (node.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
    }

    const isFsPromisesNamespace =
        node.object.type === AST_NODE_TYPES.Identifier &&
        node.object.name === 'fs' &&
        getMemberExpressionPropertyName(node) === 'promises';

    return isFsPromisesNamespace;
}

function getWriteMethodName(callee: TSESTree.CallExpression['callee']): string | null {
    if (callee.type === AST_NODE_TYPES.Identifier) {
        return callee.name;
    }

    return callee.type === AST_NODE_TYPES.MemberExpression &&
        isFsNamespaceObject(callee.object)
        ? getMemberExpressionPropertyName(callee)
        : null;
}

function isRedundantUtf8Encoding(node: TSESTree.Node): boolean {
    const value = getStaticStringValue(node);

    if (value === null) {
        return false;
    }

    const normalizedValue = value.toLowerCase();

    return normalizedValue === 'utf8' || normalizedValue === 'utf-8';
}

function hasSpreadProperty(node: TSESTree.ObjectExpression): boolean {
    return node.properties.some(
        (property) => property.type === AST_NODE_TYPES.SpreadElement,
    );
}

function findRedundantEncodingProperty(
    node: TSESTree.ObjectExpression,
): TSESTree.Property | null {
    if (hasSpreadProperty(node)) {
        return null;
    }

    const encodingProperties = node.properties.filter(
        (property): property is TSESTree.Property =>
            property.type === AST_NODE_TYPES.Property &&
            getObjectPropertyName(property) === 'encoding',
    );

    if (encodingProperties.length !== 1) {
        return null;
    }

    const encodingProperty = encodingProperties[0];

    return encodingProperty && isRedundantUtf8Encoding(encodingProperty.value)
        ? encodingProperty
        : null;
}

function getObjectPropertyFix(
    sourceCode: Readonly<TSESLint.SourceCode>,
    fixer: TSESLint.RuleFixer,
    objectExpression: TSESTree.ObjectExpression,
    property: TSESTree.Property,
): TSESLint.RuleFix | null {
    const propertyIndex = objectExpression.properties.indexOf(property);
    const previousProperty = objectExpression.properties[propertyIndex - 1] ?? null;
    const nextProperty = objectExpression.properties[propertyIndex + 1] ?? null;

    return removeCommaSeparatedNode(
        sourceCode,
        fixer,
        property,
        previousProperty,
        nextProperty,
    );
}

function getOptionsArgumentFix(
    sourceCode: Readonly<TSESLint.SourceCode>,
    fixer: TSESLint.RuleFixer,
    callExpression: TSESTree.CallExpression,
    options: TSESTree.Expression,
): TSESLint.RuleFix | null {
    const argumentIndex = callExpression.arguments.indexOf(options);
    const previousArgument = callExpression.arguments[argumentIndex - 1] ?? null;
    const nextArgument = callExpression.arguments[argumentIndex + 1] ?? null;

    return removeCommaSeparatedNode(
        sourceCode,
        fixer,
        options,
        previousArgument,
        nextArgument,
    );
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        function reportRedundantEncodingArgument(
            callExpression: TSESTree.CallExpression,
            encodingArgument: TSESTree.Expression,
        ): void {
            context.report({
                fix(fixer) {
                    return getOptionsArgumentFix(
                        sourceCode,
                        fixer,
                        callExpression,
                        encodingArgument,
                    );
                },
                messageId: 'noRedundantFsEncoding',
                node: encodingArgument,
            });
        }

        function reportRedundantEncodingProperty(
            callExpression: TSESTree.CallExpression,
            options: TSESTree.ObjectExpression,
            encodingProperty: TSESTree.Property,
        ): void {
            context.report({
                fix(fixer) {
                    const hasOnlyEncodingProperty = options.properties.length === 1;

                    return hasOnlyEncodingProperty
                        ? getOptionsArgumentFix(
                              sourceCode,
                              fixer,
                              callExpression,
                              options,
                          )
                        : getObjectPropertyFix(
                              sourceCode,
                              fixer,
                              options,
                              encodingProperty,
                          );
                },
                messageId: 'noRedundantFsEncoding',
                node: encodingProperty,
            });
        }

        return {
            CallExpression(node: TSESTree.CallExpression) {
                if (!isWriteMethod(getWriteMethodName(node.callee))) {
                    return;
                }

                const options = node.arguments[2];

                if (!options || options.type === AST_NODE_TYPES.SpreadElement) {
                    return;
                }

                if (options.type !== AST_NODE_TYPES.ObjectExpression) {
                    if (isRedundantUtf8Encoding(options)) {
                        reportRedundantEncodingArgument(node, options);
                    }

                    return;
                }

                const encodingProperty = findRedundantEncodingProperty(options);

                if (encodingProperty) {
                    reportRedundantEncodingProperty(node, options, encodingProperty);
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow redundant default utf8 encoding in Node.js file write calls.',
        },
        fixable: 'code',
        messages: {
            noRedundantFsEncoding:
                'Remove redundant utf8 encoding. Node.js file write methods use utf8 by default for string data.',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'no-redundant-fs-encoding',
});

export default rule;
