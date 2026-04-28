import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import {type SourceCode} from '@typescript-eslint/utils/ts-eslint';

import {
    collectSignalUsages,
    getReactiveCallbackArgument,
    getReactiveScopes,
    isAngularUntrackedCall,
    isGetterMemberAccess,
    isSignalReadCall,
    isWritableSignalWrite,
    walkSynchronousAst,
} from '../utils/angular/angular-signals';
import {
    buildImportRemovalFixes,
    findUntrackedAlias,
} from '../utils/angular/import-fix-helpers';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from '../utils/angular/untracked-docs';
import {collectCallExpressions} from '../utils/ast/call-expressions';
import {dedent} from '../utils/text/dedent';
import {type NodeMap} from '../utils/typescript/node-map';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type MessageId = 'uselessUntracked';

/**
 * Builds the replacement text for the parent ExpressionStatement of an
 * `untracked(...)` call.
 *
 * - Block body: extracts inner statements and re-indents them to match the
 *   parent ExpressionStatement's indentation.
 * - Expression body: returns `<expr>;` (no trailing double-semicolon).
 *
 * Returns null if the untracked argument is not a function expression.
 */
function buildReplacement(
    untrackedCall: TSESTree.CallExpression,
    parentStatement: TSESTree.ExpressionStatement,
    sourceCode: SourceCode,
): string | null {
    const callback = getReactiveCallbackArgument(untrackedCall);

    if (!callback) {
        return null;
    }

    const {body} = callback;

    if (body.type === AST_NODE_TYPES.BlockStatement) {
        const {body: stmts} = body;
        const [firstStmt] = stmts;

        if (!firstStmt) {
            return null; // Nothing to replace with — let caller delete the statement
        }

        const parentColumn = parentStatement.loc.start.column;
        const firstStmtColumn = firstStmt.loc.start.column;
        const extra = firstStmtColumn - parentColumn;

        const indented = stmts.map((s) => dedent(sourceCode.getText(s), extra));

        return indented.join(`\n${''.padStart(parentColumn)}`);
    }

    // Expression body: arrow `() => expr` — just emit `expr;`
    return `${sourceCode.getText(body)};`;
}

function hasOpaqueSynchronousCalls(
    root: TSESTree.Node,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
    program: TSESTree.Program,
): boolean {
    let found = false;

    walkSynchronousAst(root, (node) => {
        if (node.type === AST_NODE_TYPES.MemberExpression) {
            if (isGetterMemberAccess(node, checker, esTreeNodeToTSNodeMap)) {
                found = true;

                return false;
            }

            return;
        }

        if (
            node.type !== AST_NODE_TYPES.CallExpression ||
            isAngularUntrackedCall(node, program) ||
            isSignalReadCall(node, checker, esTreeNodeToTSNodeMap) ||
            isWritableSignalWrite(node, checker, esTreeNodeToTSNodeMap)
        ) {
            return;
        }

        found = true;

        return false;
    });

    return found;
}

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, program, sourceCode} =
            getTypeAwareRuleContext(context);
        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;

        function isUntrackedUsedElsewhere(
            localName: string,
            excludeNode: TSESTree.Node,
        ): boolean {
            return collectCallExpressions(program).some(
                (n) =>
                    n !== excludeNode &&
                    n.callee.type === AST_NODE_TYPES.Identifier &&
                    n.callee.name === localName,
            );
        }

        function checkUntrackedCall(
            untrackedCall: TSESTree.CallExpression,
            kind: string,
        ): void {
            const callback = getReactiveCallbackArgument(untrackedCall);

            if (!callback) {
                return;
            }

            const {reads} = collectSignalUsages(
                callback,
                checker,
                signalNodeMap,
                program,
            );

            if (
                reads.length > 0 ||
                hasOpaqueSynchronousCalls(callback, checker, signalNodeMap, program)
            ) {
                // Snapshot reads inside reactive callbacks are a valid Angular
                // pattern even when the snapshot later influences branching.
                return;
            }

            // Only fix when the parent is a plain ExpressionStatement so we can
            // replace statement-for-statement without breaking surrounding structure.
            const parent = untrackedCall.parent;
            const canFix = parent.type === AST_NODE_TYPES.ExpressionStatement;

            context.report({
                data: {kind},
                fix: canFix
                    ? (fixer) => {
                          const parentStmt = parent;
                          const replacement = buildReplacement(
                              untrackedCall,
                              parentStmt,
                              sourceCode,
                          );

                          if (replacement == null) {
                              return null;
                          }

                          const untrackedLocalName = findUntrackedAlias(program);
                          const stillUsed =
                              untrackedLocalName != null &&
                              isUntrackedUsedElsewhere(untrackedLocalName, untrackedCall);
                          const fixes = [fixer.replaceText(parentStmt, replacement)];

                          if (!stillUsed) {
                              fixes.push(
                                  ...buildImportRemovalFixes(program, fixer, sourceCode),
                              );
                          }

                          return fixes;
                      }
                    : undefined,
                messageId: 'uselessUntracked',
                node: untrackedCall,
            });
        }

        function walkForUntracked(root: TSESTree.Node, kind: string): void {
            walkSynchronousAst(root, (node) => {
                if (
                    node.type !== AST_NODE_TYPES.CallExpression ||
                    !isAngularUntrackedCall(node, program)
                ) {
                    return;
                }

                checkUntrackedCall(node, kind);

                // Do not descend — nested untracked bodies are separate scopes
                return false;
            });
        }

        return {
            CallExpression(node: TSESTree.CallExpression) {
                for (const scope of getReactiveScopes(node, program)) {
                    walkForUntracked(scope.callback, scope.kind);
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow `untracked()` wrappers inside reactive callbacks when they contain no signal reads and do not wrap opaque external code that may read signals',
            url: ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
        },
        fixable: 'code',
        messages: {
            uselessUntracked:
                'This `untracked()` wrapper is unnecessary inside `{{ kind }}` because its callback contains no signal reads that need shielding from dependency tracking. Pure writes (`.set()`, `.update()`, `.mutate()`) do not require `untracked()`. See Angular guide: https://angular.dev/guide/signals#reading-without-tracking-dependencies',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'no-useless-untracked',
});

export default rule;
