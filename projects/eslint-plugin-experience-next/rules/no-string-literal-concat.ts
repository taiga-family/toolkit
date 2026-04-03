import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

const createRule = ESLintUtils.RuleCreator((name) => name);

type Options = [];

type MessageId = 'mergeLiterals' | 'useTemplate';

type StringLiteralNode = TSESTree.StringLiteral;

function isStringLiteralNode(node: TSESTree.Node): node is StringLiteralNode {
    return (
        node.type === AST_NODE_TYPES.Literal &&
        typeof (node as TSESTree.Literal).value === 'string'
    );
}

function collectParts(node: TSESTree.Node): TSESTree.Node[] {
    if (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === '+') {
        return [...collectParts(node.left), ...collectParts(node.right)];
    }

    return [node];
}

function isRootConcat(node: TSESTree.BinaryExpression): boolean {
    const {parent} = node;

    return (
        parent.type !== AST_NODE_TYPES.BinaryExpression ||
        (parent as TSESTree.BinaryExpression).operator !== '+'
    );
}

function isStringType(type: ts.Type, checker: ts.TypeChecker): boolean {
    if (type.isUnion()) {
        return type.types.every((t) => isStringType(t, checker));
    }

    return type.isStringLiteral() || checker.typeToString(type) === 'string';
}

function buildMergedString(parts: StringLiteralNode[]): string {
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

function buildTemplateLiteral(
    parts: TSESTree.Node[],
    getText: (n: TSESTree.Node) => string,
): string {
    const inner = parts
        .map((part) => {
            if (isStringLiteralNode(part)) {
                return part.value
                    .replaceAll('\\', '\\\\')
                    .replaceAll('`', '\\`')
                    .replaceAll('${', '\\${');
            }

            return `\${${getText(part)}}`;
        })
        .join('');

    return `\`${inner}\``;
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
            if (isStringLiteralNode(node)) {
                return true;
            }

            if (!parserServices || !checker) {
                return false;
            }

            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const type = checker.getTypeAtLocation(tsNode);

            return isStringType(type, checker);
        }

        return {
            BinaryExpression(node) {
                if (node.operator !== '+') {
                    return;
                }

                if (!isRootConcat(node)) {
                    return;
                }

                const parts = collectParts(node);
                const allLiterals = parts.every(isStringLiteralNode);

                if (allLiterals) {
                    context.report({
                        fix(fixer) {
                            return fixer.replaceText(node, buildMergedString(parts));
                        },
                        messageId: 'mergeLiterals',
                        node,
                    });

                    return;
                }

                if (
                    parts.every(
                        (part) =>
                            part.type !== AST_NODE_TYPES.TemplateLiteral &&
                            isStringNode(part),
                    )
                ) {
                    context.report({
                        fix(fixer) {
                            return fixer.replaceText(
                                node,
                                buildTemplateLiteral(parts, (n) => sourceCode.getText(n)),
                            );
                        },
                        messageId: 'useTemplate',
                        node,
                    });
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
            mergeLiterals: 'Merge string literals instead of concatenating them.',
            useTemplate: 'Use a template literal instead of string concatenation.',
        },
        schema: [],
        type: 'suggestion',
    },

    name: 'no-string-literal-concat',
});

export default rule;
