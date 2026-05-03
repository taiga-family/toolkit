import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {unwrapParenthesized} from '../utils/ast/parenthesized';
import {
    getSpacingReplacement,
    hasBlankLine,
    hasCommentLikeText,
    isSingleLineNode,
} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';

type MessageIds =
    | 'missingBlankLineAfterMultilineVariable'
    | 'missingBlankLineBeforeMultilineVariable'
    | 'missingBlankLineBetweenVariableGroups'
    | 'unexpectedBlankLineBeforeNextSingleLineVariable';

interface VariableSpacingStatement {
    readonly declaration: TSESTree.VariableDeclaration;
    readonly exported: boolean;
    readonly node: TSESTree.Node;
}

function getVariableSpacingStatement(
    node: TSESTree.Node,
): VariableSpacingStatement | null {
    if (node.type === AST_NODE_TYPES.VariableDeclaration) {
        return {declaration: node, exported: false, node};
    }

    if (
        node.type !== AST_NODE_TYPES.ExportNamedDeclaration ||
        node.declaration?.type !== AST_NODE_TYPES.VariableDeclaration
    ) {
        return null;
    }

    return {declaration: node.declaration, exported: true, node};
}

function isRequireCall(node: TSESTree.Node): boolean {
    return (
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === 'require'
    );
}

function isImportLikeInitializer(node: TSESTree.Node): boolean {
    const initializer = unwrapParenthesized(node);

    if (
        initializer.type === AST_NODE_TYPES.ImportExpression ||
        isRequireCall(initializer)
    ) {
        return true;
    }

    if (initializer.type === AST_NODE_TYPES.AwaitExpression) {
        return isImportLikeInitializer(initializer.argument);
    }

    if (initializer.type === AST_NODE_TYPES.ChainExpression) {
        return isImportLikeInitializer(initializer.expression);
    }

    if (initializer.type === AST_NODE_TYPES.MemberExpression) {
        return isImportLikeInitializer(initializer.object);
    }

    if (initializer.type === AST_NODE_TYPES.CallExpression) {
        return isImportLikeInitializer(initializer.callee);
    }

    return false;
}

function isImportLikeVariableDeclaration(
    declaration: TSESTree.VariableDeclaration,
): boolean {
    if (declaration.declarations.length !== 1) {
        return false;
    }

    const [declarator] = declaration.declarations;
    const init = declarator.init;

    if (!init) {
        return false;
    }

    return isImportLikeInitializer(init);
}

export const rule = createRule<[], MessageIds>({
    create(context) {
        const sourceCode = context.sourceCode;

        const checkStatements = (statements: readonly TSESTree.Node[]): void => {
            for (let index = 0; index < statements.length - 1; index++) {
                const currentStatement = statements[index];
                const nextStatement = statements[index + 1];

                if (!currentStatement || !nextStatement) {
                    continue;
                }

                const current = getVariableSpacingStatement(currentStatement);
                const next = getVariableSpacingStatement(nextStatement);

                if (
                    !current ||
                    !next ||
                    isImportLikeVariableDeclaration(current.declaration) ||
                    isImportLikeVariableDeclaration(next.declaration)
                ) {
                    continue;
                }

                const betweenText = sourceCode.text.slice(
                    current.node.range[1],
                    next.node.range[0],
                );

                if (hasCommentLikeText(betweenText)) {
                    continue;
                }

                const currentIsSingleLine = isSingleLineNode(current.node);
                const nextIsSingleLine = isSingleLineNode(next.node);
                const blankLineBetween = hasBlankLine(betweenText);
                const sameExportGroup = current.exported === next.exported;

                if (
                    currentIsSingleLine &&
                    nextIsSingleLine &&
                    sameExportGroup &&
                    blankLineBetween
                ) {
                    context.report({
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                [current.node.range[1], next.node.range[0]],
                                getSpacingReplacement(
                                    sourceCode,
                                    betweenText,
                                    next.node.loc.start.line,
                                    0,
                                ),
                            ),
                        messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable',
                        node: next.node,
                    });

                    continue;
                }

                if (
                    currentIsSingleLine &&
                    nextIsSingleLine &&
                    !sameExportGroup &&
                    !blankLineBetween
                ) {
                    context.report({
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                [current.node.range[1], next.node.range[0]],
                                getSpacingReplacement(
                                    sourceCode,
                                    betweenText,
                                    next.node.loc.start.line,
                                    1,
                                ),
                            ),
                        messageId: 'missingBlankLineBetweenVariableGroups',
                        node: next.node,
                    });
                }

                if (currentIsSingleLine && !nextIsSingleLine && !blankLineBetween) {
                    context.report({
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                [current.node.range[1], next.node.range[0]],
                                getSpacingReplacement(
                                    sourceCode,
                                    betweenText,
                                    next.node.loc.start.line,
                                    1,
                                ),
                            ),
                        messageId: 'missingBlankLineBeforeMultilineVariable',
                        node: next.node,
                    });

                    continue;
                }

                if (!currentIsSingleLine && !blankLineBetween) {
                    context.report({
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                [current.node.range[1], next.node.range[0]],
                                getSpacingReplacement(
                                    sourceCode,
                                    betweenText,
                                    next.node.loc.start.line,
                                    1,
                                ),
                            ),
                        messageId: 'missingBlankLineAfterMultilineVariable',
                        node: next.node,
                    });
                }
            }
        };

        return {
            BlockStatement(node: TSESTree.BlockStatement) {
                checkStatements(node.body);
            },

            Program(node: TSESTree.Program) {
                checkStatements(node.body);
            },

            StaticBlock(node: TSESTree.StaticBlock) {
                checkStatements(node.body);
            },

            SwitchCase(node: TSESTree.SwitchCase) {
                checkStatements(node.consequent);
            },

            TSModuleBlock(node: TSESTree.TSModuleBlock) {
                checkStatements(node.body);
            },
        };
    },
    meta: {
        docs: {
            description:
                'Group consecutive single-line variable declarations together, while separating multiline variable declarations with blank lines',
        },
        fixable: 'code',
        messages: {
            missingBlankLineAfterMultilineVariable:
                'Multiline variable declarations should be followed by a blank line before the next variable declaration',
            missingBlankLineBeforeMultilineVariable:
                'Multiline variable declarations should be preceded by a blank line after single-line variable declarations',
            missingBlankLineBetweenVariableGroups:
                'Exported and non-exported variable declarations should be separated by a blank line',
            unexpectedBlankLineBeforeNextSingleLineVariable:
                'Single-line variable declarations should not be separated by a blank line before the next single-line variable declaration',
        },
        schema: [],
        type: 'layout',
    },
    name: 'single-line-variable-spacing',
});

export default rule;
