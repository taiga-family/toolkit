import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {hasAncestor} from '../utils/ast/ancestors';
import {isStringLiteral} from '../utils/ast/string-literals';
import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'flattenTemplate' | 'mergeLiterals' | 'useTemplate';

function collectParts(node: TSESTree.Node): TSESTree.Node[] {
    if (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === '+') {
        return [...collectParts(node.left), ...collectParts(node.right)];
    }

    return [node];
}

function isRootConcat(node: TSESTree.BinaryExpression): boolean {
    const {parent} = node;

    return parent.type !== AST_NODE_TYPES.BinaryExpression || parent.operator !== '+';
}

function isStringType(type: ts.Type, checker: ts.TypeChecker): boolean {
    if (type.isUnion()) {
        return type.types.every((t) => isStringType(t, checker));
    }

    return type.isStringLiteral() || checker.typeToString(type) === 'string';
}

function buildMergedString(parts: TSESTree.StringLiteral[]): string {
    const combined = parts.map((p) => p.value).join('');
    const quote = combined.includes("'") && !combined.includes('"') ? '"' : "'";
    const escaped = combined
        .replaceAll('\\', '\\\\')
        .replaceAll('\r', String.raw`\r`)
        .replaceAll('\n', String.raw`\n`)
        .replaceAll('\t', String.raw`\t`)
        .replaceAll(new RegExp(quote, 'g'), `\\${quote}`);

    return `${quote}${escaped}${quote}`;
}

function escapeForTemplateLiteral(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

function partsToTemplateContent(
    parts: TSESTree.Node[],
    getText: (n: TSESTree.Node) => string,
): string {
    return parts
        .map((part) =>
            isStringLiteral(part)
                ? escapeForTemplateLiteral(part.value)
                : `\${${getText(part)}}`,
        )
        .join('');
}

/**
 * Returns the raw content between the backticks of a TemplateLiteral,
 * delegating each expression slot to `renderExpr`.
 */
function templateContent(
    template: TSESTree.TemplateLiteral,
    renderExpr: (expr: TSESTree.Expression, index: number) => string,
): string {
    return template.quasis
        .map(
            (quasi, i) =>
                `${quasi.value.raw}${
                    i < template.expressions.length
                        ? renderExpr(template.expressions[i]!, i)
                        : ''
                }`,
        )
        .join('');
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        let parserServices: ReturnType<typeof ESLintUtils.getParserServices> | null =
            null;
        let checker: ts.TypeChecker | null = null;

        try {
            parserServices = ESLintUtils.getParserServices(context);
            checker = parserServices.program.getTypeChecker();
        } catch {
            // Type checking not available — only literal concatenation will be checked
        }

        function isStringNode(node: TSESTree.Node): boolean {
            if (isStringLiteral(node)) {
                return true;
            }

            if (!parserServices || !checker) {
                return false;
            }

            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

            return isStringType(checker.getTypeAtLocation(tsNode), checker);
        }

        const getText = (n: TSESTree.Node): string => sourceCode.getText(n);
        const wrapExpr = (expr: TSESTree.Expression): string => `\${${getText(expr)}}`;

        return {
            BinaryExpression(node) {
                if (node.operator !== '+' || !isRootConcat(node)) {
                    return;
                }

                // Comments between parts serve as inline documentation — preserve them
                if (sourceCode.getCommentsInside(node).length > 0) {
                    return;
                }

                const parts = collectParts(node);

                if (
                    !parts.every(
                        (p) =>
                            p.type !== AST_NODE_TYPES.TemplateLiteral && isStringNode(p),
                    )
                ) {
                    return;
                }

                const allLiterals = parts.every(isStringLiteral);

                // Direct child of a template expression → inline parts to avoid
                // nested template literals like `${`${a}${b}`}`
                if (node.parent.type === AST_NODE_TYPES.TemplateLiteral) {
                    const template = node.parent;

                    // Tagged templates: changing quasis/expressions count alters behaviour
                    if (
                        template.parent.type === AST_NODE_TYPES.TaggedTemplateExpression
                    ) {
                        return;
                    }

                    context.report({
                        fix: (fixer) =>
                            fixer.replaceText(
                                template,
                                `\`${templateContent(template, (expr) => (expr === node ? partsToTemplateContent(parts, getText) : wrapExpr(expr)))}\``,
                            ),
                        messageId: allLiterals ? 'mergeLiterals' : 'useTemplate',
                        node,
                    });

                    return;
                }

                // Nested inside a template but not direct child — would produce
                // `${`${a}${b}`.method()}`, so skip
                if (
                    hasAncestor(
                        node,
                        (ancestor) => ancestor.type === AST_NODE_TYPES.TemplateLiteral,
                    )
                ) {
                    return;
                }

                context.report({
                    fix: (fixer) =>
                        fixer.replaceText(
                            node,
                            allLiterals
                                ? buildMergedString(parts)
                                : `\`${partsToTemplateContent(parts, getText)}\``,
                        ),
                    messageId: allLiterals ? 'mergeLiterals' : 'useTemplate',
                    node,
                });
            },

            TemplateLiteral(node) {
                // Tagged templates: changing quasis/expressions count alters behaviour
                if (node.parent.type === AST_NODE_TYPES.TaggedTemplateExpression) {
                    return;
                }

                for (const [i, expr] of node.expressions.entries()) {
                    if (
                        expr.type === AST_NODE_TYPES.TemplateLiteral &&
                        expr.parent.type !== AST_NODE_TYPES.TaggedTemplateExpression
                    ) {
                        context.report({
                            fix: (fixer) =>
                                fixer.replaceText(
                                    node,
                                    `\`${templateContent(node, (e, j) => (j === i ? templateContent(expr, wrapExpr) : wrapExpr(e)))}\``,
                                ),
                            messageId: 'flattenTemplate',
                            node: expr,
                        });
                    }
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow string concatenation. Merge adjacent string literals into one; use template literals for string variables.',
        },
        fixable: 'code',
        messages: {
            flattenTemplate: 'Flatten nested template literal into its parent.',
            mergeLiterals: 'Merge string literals instead of concatenating them.',
            useTemplate: 'Use a template literal instead of string concatenation.',
        },
        schema: [],
        type: 'suggestion',
    },

    name: 'no-string-literal-concat',
});

export default rule;
