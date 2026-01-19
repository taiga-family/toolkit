import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

type Options = [{printWidth: number}];

type MessageIds = 'oneLine';

export const rule = createRule<Options, MessageIds>({
    create(context, [{printWidth}]) {
        const sourceCode = context.sourceCode;

        const canInlineObjectExpression = (node: TSESTree.ObjectExpression): boolean => {
            if (
                node.properties.length !== 1 ||
                sourceCode.getCommentsInside(node).length > 0 ||
                isInsideMultiArgCallOrNew(node)
            ) {
                return false;
            }

            return !isForbiddenSingleProperty(node.properties[0]);
        };

        const renderPropertyOneLine = (
            property?: TSESTree.ObjectLiteralElement,
        ): string => {
            if (property?.type === AST_NODE_TYPES.SpreadElement) {
                return `...${sourceCode.getText(property.argument)}`;
            }

            if (property?.type !== AST_NODE_TYPES.Property) {
                return sourceCode.getText(property);
            }

            if (property.kind !== 'init' || property.method) {
                return sourceCode.getText(property);
            }

            if (property.shorthand && property.key.type === AST_NODE_TYPES.Identifier) {
                return property.key.name;
            }

            const keyText = sourceCode.getText(property.key);

            const expression = property.value as unknown as TSESTree.Expression;
            const valueText =
                expression.type === AST_NODE_TYPES.ObjectExpression &&
                canInlineObjectExpression(expression)
                    ? `{${renderPropertyOneLine(expression.properties[0])}}`
                    : sourceCode.getText(expression);

            if (property.computed) {
                return `[${keyText}]: ${valueText}`;
            }

            return `${keyText}: ${valueText}`;
        };

        const fitsPrintWidthAfterFix = (
            node: TSESTree.ObjectExpression,
            fixedText: string,
        ): boolean => {
            const startLine = node.loc.start.line;
            const endLine = node.loc.end.line;
            const endLineText = sourceCode.lines[endLine - 1] ?? '';

            const startLineStartIndex = sourceCode.getIndexFromLoc({
                column: 0,
                line: startLine,
            });

            const endLineStartIndex = sourceCode.getIndexFromLoc({
                column: 0,
                line: endLine,
            });

            const endLineEndIndex = endLineStartIndex + endLineText.length;
            const nodeStartIndex = node.range[0];
            const nodeEndIndex = node.range[1];
            const prefix = sourceCode.text.slice(startLineStartIndex, nodeStartIndex);
            const suffix = sourceCode.text.slice(nodeEndIndex, endLineEndIndex);
            const newLineText = `${prefix}${fixedText}${suffix}`;

            return newLineText.length <= printWidth;
        };

        return {
            ObjectExpression(node: TSESTree.ObjectExpression) {
                if (!canInlineObjectExpression(node)) {
                    return;
                }

                const originalText = sourceCode.getText(node);

                if (!originalText.includes('\n')) {
                    return;
                }

                const onlyProperty = node.properties[0];
                const propertyText = renderPropertyOneLine(onlyProperty);
                const fixedText = `{${propertyText}}`;

                if (!fitsPrintWidthAfterFix(node, fixedText)) {
                    return;
                }

                context.report({
                    fix(fixer) {
                        return fixer.replaceText(node, fixedText);
                    },
                    messageId: 'oneLine',
                    node,
                });
            },
        };
    },
    defaultOptions: [{printWidth: 90}],
    meta: {
        docs: {
            description:
                'Enforce single-line formatting for single-property objects when possible (recursive, Prettier-friendly)',
        },
        fixable: 'whitespace',
        messages: {oneLine: 'Single-property object should be written in one line'},
        schema: [
            {
                additionalProperties: false,
                properties: {printWidth: {type: 'number'}},
                type: 'object',
            },
        ],
        type: 'layout',
    },
    name: 'object-single-line',
});

export default rule;

/**
 * Avoid Prettier fight zones like Object.defineProperty(..., { ... })
 */
function isInsideMultiArgCallOrNew(node: TSESTree.ObjectExpression): boolean {
    const parent = node.parent;

    return parent.type === AST_NODE_TYPES.CallExpression ||
        parent.type === AST_NODE_TYPES.NewExpression
        ? parent.arguments.length > 1
        : false;
}

function isTemplateLikeExpression(expression: TSESTree.Expression): boolean {
    return (
        expression.type === AST_NODE_TYPES.TemplateLiteral ||
        expression.type === AST_NODE_TYPES.TaggedTemplateExpression
    );
}

/**
 * Ignore getters/setters/methods/template literals
 * Ignore template literals: {code: `...`}
 */
function isForbiddenSingleProperty(property?: TSESTree.ObjectLiteralElement): boolean {
    if (property?.type !== AST_NODE_TYPES.Property) {
        return false;
    }

    if (property.kind === 'get' || property.kind === 'set' || property.method) {
        return true;
    }

    const value = property.value as unknown;

    if (value && typeof value === 'object' && 'type' in (value as any)) {
        const expression = value as TSESTree.Expression;

        if (isTemplateLikeExpression(expression)) {
            return true;
        }
    }

    return false;
}
