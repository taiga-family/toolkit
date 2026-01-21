import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

type Options = [{printWidth: number}];

type MessageIds = 'oneLine';

export const rule = createRule<Options, MessageIds>({
    create(context, [{printWidth}]) {
        const sourceCode = context.sourceCode;

        const getLineEndIndex = (lineStartIndex: number): number => {
            const text = sourceCode.text;
            const newLineIndex = text.indexOf('\n', lineStartIndex);
            const rawEndIndex = newLineIndex === -1 ? text.length : newLineIndex;

            if (rawEndIndex > lineStartIndex && text[rawEndIndex - 1] === '\r') {
                return rawEndIndex - 1;
            }

            return rawEndIndex;
        };

        const hasAnyCommentsInside = (node: TSESTree.Node): boolean =>
            sourceCode.getCommentsInside(node).length > 0;

        const isTemplateLikeExpression = (expression: TSESTree.Expression): boolean =>
            expression.type === AST_NODE_TYPES.TemplateLiteral ||
            expression.type === AST_NODE_TYPES.TaggedTemplateExpression;

        const isForbiddenProperty = (
            property: TSESTree.ObjectLiteralElement,
        ): boolean => {
            if (property.type !== AST_NODE_TYPES.Property) {
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
        };

        const canInlineObjectExpression = (node?: TSESTree.ObjectExpression): boolean => {
            if (
                !node?.loc ||
                node.properties.length !== 1 ||
                hasAnyCommentsInside(node)
            ) {
                return false;
            }

            const [onlyProperty] = node.properties;

            return !onlyProperty ? false : !isForbiddenProperty(onlyProperty);
        };

        const unwrapExpression = (
            expression: TSESTree.Expression,
        ): TSESTree.Expression => {
            let current = expression;
            let didUnwrap = true;

            while (didUnwrap) {
                didUnwrap = false;

                switch (current.type) {
                    case AST_NODE_TYPES.ChainExpression:
                        current = current.expression as unknown as TSESTree.Expression;
                        didUnwrap = true;
                        break;

                    case AST_NODE_TYPES.TSAsExpression:
                        current = current.expression as unknown as TSESTree.Expression;
                        didUnwrap = true;
                        break;

                    case AST_NODE_TYPES.TSNonNullExpression:
                        current = current.expression as unknown as TSESTree.Expression;
                        didUnwrap = true;
                        break;

                    case AST_NODE_TYPES.TSTypeAssertion:
                        current = current.expression as unknown as TSESTree.Expression;
                        didUnwrap = true;
                        break;

                    default:
                        break;
                }
            }

            return current;
        };

        const getParenthesizedInner = (
            expression: TSESTree.Expression,
        ): TSESTree.Expression | null => {
            const anyExpression = expression as any;

            if (anyExpression?.type === 'ParenthesizedExpression') {
                const inner = anyExpression.expression as TSESTree.Expression | undefined;

                if (inner) {
                    return inner;
                }
            }

            return null;
        };

        const spreadNeedsParens = (argument: TSESTree.Expression): boolean => {
            switch (argument.type) {
                case AST_NODE_TYPES.AssignmentExpression:
                case AST_NODE_TYPES.BinaryExpression:
                case AST_NODE_TYPES.ConditionalExpression:
                case AST_NODE_TYPES.LogicalExpression:
                case AST_NODE_TYPES.SequenceExpression:
                    return true;
                default:
                    return false;
            }
        };

        const renderSpreadOneLine = (argument: TSESTree.Expression): string => {
            const argText = sourceCode.getText(argument);

            return spreadNeedsParens(argument) ? `...(${argText})` : `...${argText}`;
        };

        const renderPropertyOneLine = (
            property: TSESTree.ObjectLiteralElement,
        ): string => {
            if (property.type === AST_NODE_TYPES.SpreadElement) {
                return renderSpreadOneLine(
                    property.argument as unknown as TSESTree.Expression,
                );
            }

            if (
                (property.type as unknown) !== AST_NODE_TYPES.Property ||
                property.kind !== 'init' ||
                property.method
            ) {
                return sourceCode.getText(property);
            }

            if (property.shorthand && property.key.type === AST_NODE_TYPES.Identifier) {
                return property.key.name;
            }

            const keyText = sourceCode.getText(property.key);
            const valueExpression = property.value as unknown as TSESTree.Expression;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            const valueText = renderExpressionOneLine(valueExpression);

            if (property.computed) {
                return `[${keyText}]: ${valueText}`;
            }

            return `${keyText}: ${valueText}`;
        };

        const renderObjectExpressionOneLine = (
            node: TSESTree.ObjectExpression,
        ): string => {
            const [onlyProperty] = node.properties;

            if (!onlyProperty) {
                return '{}';
            }

            return `{${renderPropertyOneLine(onlyProperty)}}`;
        };

        const renderExpressionOneLine = (expression: TSESTree.Expression): string => {
            const innerParen = getParenthesizedInner(expression);

            if (innerParen) {
                const inner = unwrapExpression(innerParen);

                if (
                    inner.type === AST_NODE_TYPES.ObjectExpression &&
                    canInlineObjectExpression(inner)
                ) {
                    return `(${renderObjectExpressionOneLine(inner)})`;
                }

                return sourceCode.getText(expression);
            }

            const unwrapped = unwrapExpression(expression);

            if (
                unwrapped.type === AST_NODE_TYPES.ObjectExpression &&
                canInlineObjectExpression(unwrapped)
            ) {
                return renderObjectExpressionOneLine(unwrapped);
            }

            return sourceCode.getText(expression);
        };

        const hasPendingInnerInlineCandidate = (
            node: TSESTree.ObjectExpression,
        ): boolean => {
            if (node.properties.length !== 1) {
                return false;
            }

            const [onlyElement] = node.properties;

            if (
                onlyElement?.type !== AST_NODE_TYPES.Property ||
                onlyElement.kind !== 'init' ||
                onlyElement.method
            ) {
                return false;
            }

            const rawValue = onlyElement.value as unknown as TSESTree.Expression;
            const value = unwrapExpression(rawValue);
            const innerParen = getParenthesizedInner(value);

            if (innerParen) {
                const inner = unwrapExpression(innerParen);

                if (
                    inner.type === AST_NODE_TYPES.ObjectExpression &&
                    canInlineObjectExpression(inner)
                ) {
                    const innerText = sourceCode.getText(inner);

                    return innerText.includes('\n');
                }
            }

            if (value.type === AST_NODE_TYPES.ArrowFunctionExpression) {
                const bodyAny = value.body as any;

                if (bodyAny?.type === 'ParenthesizedExpression') {
                    const bodyInner = bodyAny.expression as
                        | TSESTree.Expression
                        | undefined;

                    if (bodyInner) {
                        const inner = unwrapExpression(bodyInner);

                        if (
                            inner.type === AST_NODE_TYPES.ObjectExpression &&
                            canInlineObjectExpression(inner)
                        ) {
                            const innerText = sourceCode.getText(inner);

                            return innerText.includes('\n');
                        }
                    }
                } else if (bodyAny && typeof bodyAny === 'object' && 'type' in bodyAny) {
                    const bodyExpr = unwrapExpression(bodyAny as TSESTree.Expression);

                    if (
                        bodyExpr.type === AST_NODE_TYPES.ObjectExpression &&
                        canInlineObjectExpression(bodyExpr)
                    ) {
                        const innerText = sourceCode.getText(bodyExpr);

                        return innerText.includes('\n');
                    }
                }
            }

            return false;
        };

        const hasArrowReturningMultiPropObject = (
            node: TSESTree.ObjectExpression,
        ): boolean => {
            if (node.properties.length !== 1) {
                return false;
            }

            const [onlyElement] = node.properties;

            if (
                onlyElement?.type !== AST_NODE_TYPES.Property ||
                onlyElement.kind !== 'init' ||
                onlyElement.method
            ) {
                return false;
            }

            const rawValue = onlyElement.value as unknown as TSESTree.Expression;
            const value = unwrapExpression(rawValue);

            if (value.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
                return false;
            }

            const bodyAny = value.body as any;

            if (bodyAny?.type === 'ParenthesizedExpression') {
                const innerRaw = bodyAny.expression as TSESTree.Expression | undefined;

                if (!innerRaw) {
                    return false;
                }

                const inner = unwrapExpression(innerRaw);

                return (
                    inner.type === AST_NODE_TYPES.ObjectExpression &&
                    inner.properties.length > 1
                );
            }

            if (bodyAny && typeof bodyAny === 'object' && 'type' in bodyAny) {
                const inner = unwrapExpression(bodyAny as TSESTree.Expression);

                return (
                    inner.type === AST_NODE_TYPES.ObjectExpression &&
                    inner.properties.length > 1
                );
            }

            return false;
        };

        const fitsPrintWidthAfterFix = (
            node: TSESTree.ObjectExpression | undefined,
            fixedText: string,
        ): boolean => {
            if (!node?.loc) {
                return false;
            }

            const startLine = node.loc.start.line;
            const endLine = node.loc.end.line;

            const startLineStartIndex = sourceCode.getIndexFromLoc({
                column: 0,
                line: startLine,
            });

            const endLineStartIndex = sourceCode.getIndexFromLoc({
                column: 0,
                line: endLine,
            });

            const endLineEndIndex = getLineEndIndex(endLineStartIndex);
            const nodeStartIndex = node.range[0];
            const nodeEndIndex = node.range[1];
            const prefix = sourceCode.text.slice(startLineStartIndex, nodeStartIndex);
            const suffix = sourceCode.text.slice(nodeEndIndex, endLineEndIndex);
            const newLineText = `${prefix}${fixedText}${suffix}`;

            return newLineText.length <= printWidth;
        };

        return {
            ObjectExpression(node: TSESTree.ObjectExpression) {
                const originalText = sourceCode.getText(node);

                if (
                    !canInlineObjectExpression(node) ||
                    !originalText.includes('\n') ||
                    hasPendingInnerInlineCandidate(node) ||
                    hasArrowReturningMultiPropObject(node)
                ) {
                    return;
                }

                const fixedText = renderObjectExpressionOneLine(node);

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
                'Enforce single-line formatting for single-property objects when possible (Prettier-friendly)',
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
