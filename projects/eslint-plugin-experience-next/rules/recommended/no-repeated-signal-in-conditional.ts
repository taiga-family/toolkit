import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

import {isSignalReadCall, type NodeMap} from '../utils/angular/angular-signals';
import {isFunctionLike, walkAst} from '../utils/ast/ast-walk';
import {createRule} from '../utils/create-rule';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type Options = [];

type MessageId = 'noRepeatedSignalInConditional';

function isNullableCallType(
    call: TSESTree.CallExpression,
    checker: ts.TypeChecker,
    nodeMap: NodeMap,
): boolean {
    try {
        const tsNode = nodeMap.get(call);

        if (!tsNode) {
            return false;
        }

        const type = checker.getTypeAtLocation(tsNode);

        if (!(type.flags & ts.TypeFlags.Union)) {
            return false;
        }

        return (type as ts.UnionType).types.some(
            (t) => !!(t.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined)),
        );
    } catch {
        return false;
    }
}

function getCalleeName(node: TSESTree.CallExpression): string {
    const {callee} = node;

    if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        !callee.computed &&
        callee.property.type === AST_NODE_TYPES.Identifier
    ) {
        return callee.property.name;
    }

    // Append 'Val' to avoid shadowing the signal variable itself (e.g. const xVal = x())
    if (callee.type === AST_NODE_TYPES.Identifier) {
        return `${callee.name}Val`;
    }

    return 'value';
}

function findParentStatement(node: TSESTree.Node): TSESTree.Statement | null {
    for (let current = node; current.parent; current = current.parent) {
        if (isFunctionLike(current)) {
            return null;
        }

        if (
            current.parent.type === AST_NODE_TYPES.BlockStatement ||
            current.parent.type === AST_NODE_TYPES.Program
        ) {
            return current as TSESTree.Statement;
        }
    }

    return null;
}

function findConciseArrowAncestor(
    node: TSESTree.Node,
): TSESTree.ArrowFunctionExpression | null {
    for (let current = node; current.parent; current = current.parent) {
        const {parent} = current;

        if (
            parent.type === AST_NODE_TYPES.ArrowFunctionExpression &&
            parent.body.type !== AST_NODE_TYPES.BlockStatement
        ) {
            return parent;
        }

        if (isFunctionLike(parent)) {
            return null;
        }
    }

    return null;
}

function getArrowBodyIndent(
    arrowFn: TSESTree.ArrowFunctionExpression,
    sourceText: string,
): {innerIndent: string; outerIndent: string} {
    const arrowStart = arrowFn.range[0];
    const lineStart = sourceText.lastIndexOf('\n', arrowStart - 1) + 1;
    const textBeforeArrow = sourceText.slice(lineStart, arrowStart);
    const outerIndent = /^(\s*)/.exec(textBeforeArrow)?.[1] ?? '';

    return {innerIndent: `${outerIndent}    `, outerIndent};
}

function getStatementIndent(statement: TSESTree.Statement, sourceText: string): string {
    const start = statement.range[0];
    const lineStart = sourceText.lastIndexOf('\n', start - 1) + 1;
    const before = sourceText.slice(lineStart, start);

    return /^\s*$/.test(before) ? before : '';
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, sourceCode} =
            getTypeAwareRuleContext(context);

        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;

        function checkNode(
            node: TSESTree.ConditionalExpression | TSESTree.IfStatement,
        ): void {
            const callsByText = new Map<string, TSESTree.CallExpression[]>();

            walkAst(node, (child) => {
                if (child === node) {
                    return;
                }

                if (
                    child.type === AST_NODE_TYPES.ConditionalExpression ||
                    child.type === AST_NODE_TYPES.IfStatement ||
                    isFunctionLike(child)
                ) {
                    return false;
                }

                if (
                    child.type === AST_NODE_TYPES.CallExpression &&
                    isSignalReadCall(child, checker, signalNodeMap) &&
                    isNullableCallType(child, checker, signalNodeMap)
                ) {
                    const text = sourceCode.getText(child);
                    const list = callsByText.get(text) ?? [];

                    list.push(child);
                    callsByText.set(text, list);
                }

                return;
            });

            for (const [callText, calls] of callsByText) {
                if (calls.length < 2) {
                    continue;
                }

                const firstCall = calls[0];

                if (!firstCall) {
                    continue;
                }

                context.report({
                    data: {call: callText},
                    fix(fixer): TSESLint.RuleFix[] | null {
                        const varName = getCalleeName(firstCall);
                        const parentStatement = findParentStatement(node);

                        if (parentStatement) {
                            const indent = getStatementIndent(
                                parentStatement,
                                sourceCode.text,
                            );

                            const fixes = [
                                fixer.insertTextBefore(
                                    parentStatement,
                                    `const ${varName} = ${callText};\n\n${indent}`,
                                ),
                            ];

                            for (const call of calls) {
                                const {parent} = call;

                                const target =
                                    parent.type === AST_NODE_TYPES.TSAsExpression
                                        ? parent
                                        : call;

                                fixes.push(fixer.replaceText(target, varName));
                            }

                            return fixes;
                        }

                        const arrowFn = findConciseArrowAncestor(node);

                        if (!arrowFn) {
                            return null;
                        }

                        const arrowBody = arrowFn.body as TSESTree.Expression;

                        const {innerIndent, outerIndent} = getArrowBodyIndent(
                            arrowFn,
                            sourceCode.text,
                        );

                        const bodyText = sourceCode.getText(arrowBody);
                        const bodyStart = arrowBody.range[0];

                        const targets = calls
                            .map((call) => {
                                const {parent} = call;

                                return parent.type === AST_NODE_TYPES.TSAsExpression
                                    ? parent
                                    : call;
                            })
                            .sort((a, b) => a.range[0] - b.range[0]);

                        let replacedBody = '';
                        let lastIndex = 0;

                        for (const target of targets) {
                            const start = target.range[0] - bodyStart;
                            const end = target.range[1] - bodyStart;

                            replacedBody += `${bodyText.slice(lastIndex, start)}${varName}`;
                            lastIndex = end;
                        }

                        replacedBody += bodyText.slice(lastIndex);

                        const newBody = `{\n${innerIndent}const ${varName} = ${callText};\n\n${innerIndent}return ${replacedBody};\n${outerIndent}}`;

                        return [fixer.replaceText(arrowBody, newBody)];
                    },
                    messageId: 'noRepeatedSignalInConditional',
                    node: firstCall,
                });
            }
        }

        return {
            ConditionalExpression: checkNode,
            IfStatement: checkNode,
        };
    },
    meta: {
        docs: {
            description:
                'Disallow reading the same nullable Angular signal more than once in a conditional (ternary or if) expression; extract it to a const variable instead',
        },
        fixable: 'code',
        messages: {
            noRepeatedSignalInConditional:
                'Signal `{{call}}` is read multiple times in this conditional; extract it to a const variable',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'no-repeated-signal-in-conditional',
});

export default rule;
