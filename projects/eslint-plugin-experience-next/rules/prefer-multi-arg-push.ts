import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

type Options = [];

type MessageId = 'preferMultiArgPush';

type PushCallExpression = TSESTree.CallExpression & {
    callee: TSESTree.MemberExpression;
};

function getPushCall(node: TSESTree.ExpressionStatement): PushCallExpression | null {
    if (node.expression.type !== AST_NODE_TYPES.CallExpression) {
        return null;
    }

    const call = node.expression;

    if (call.callee.type !== AST_NODE_TYPES.MemberExpression) {
        return null;
    }

    const {property} = call.callee;

    if (property.type !== AST_NODE_TYPES.Identifier || property.name !== 'push') {
        return null;
    }

    return call as PushCallExpression;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        function checkBody(statements: TSESTree.Statement[]): void {
            let i = 0;

            while (i < statements.length) {
                const stmt = statements[i];

                if (!stmt) {
                    break;
                }

                if (stmt.type !== AST_NODE_TYPES.ExpressionStatement) {
                    i++;
                    continue;
                }

                const call = getPushCall(stmt);

                if (!call) {
                    i++;
                    continue;
                }

                const arrayText = sourceCode.getText(call.callee.object);
                const group = [stmt];
                let j = i + 1;

                while (j < statements.length) {
                    const nextStmt = statements[j];

                    if (nextStmt?.type !== AST_NODE_TYPES.ExpressionStatement) {
                        break;
                    }

                    const nextCall = getPushCall(nextStmt);

                    if (
                        !nextCall ||
                        sourceCode.getText(nextCall.callee.object) !== arrayText
                    ) {
                        break;
                    }

                    group.push(nextStmt);
                    j++;
                }

                if (group.length > 1) {
                    for (const [idx, groupStmt] of group.entries()) {
                        context.report({
                            ...(idx === 0
                                ? {
                                      fix(fixer) {
                                          const allArgs = group
                                              .flatMap(
                                                  (s) =>
                                                      (
                                                          s.expression as TSESTree.CallExpression
                                                      ).arguments,
                                              )
                                              .map((arg) => sourceCode.getText(arg))
                                              .join(', ');
                                          const lastStmt = group[group.length - 1];

                                          if (!lastStmt) {
                                              return null;
                                          }

                                          return fixer.replaceTextRange(
                                              [groupStmt.range[0], lastStmt.range[1]],
                                              `${arrayText}.push(${allArgs});`,
                                          );
                                      },
                                  }
                                : {}),
                            messageId: 'preferMultiArgPush',
                            node: groupStmt,
                        });
                    }
                }

                i = j;
            }
        }

        return {
            BlockStatement(node) {
                checkBody(node.body);
            },
            Program(node) {
                checkBody(node.body);
            },
        };
    },

    meta: {
        docs: {
            description:
                'Enforce combining consecutive .push() calls on the same array into a single call.',
        },
        fixable: 'code',
        messages: {
            preferMultiArgPush:
                'Combine consecutive .push() calls on the same array into a single multi-argument call.',
        },
        schema: [],
        type: 'suggestion',
    },

    name: 'prefer-multi-arg-push',
});

export default rule;
