import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {
    getReactiveScopes,
    isAngularUntrackedCall,
    isSignalReadCall,
    type NodeMap,
    walkAfterAsyncBoundaryAst,
} from './utils/angular-signals';
import {
    ANGULAR_SIGNALS_ASYNC_GUIDE_URL,
    createUntrackedRule,
} from './utils/untracked-docs';

type MessageId = 'readAfterAwait';

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const esTreeNodeToTSNodeMap =
            parserServices.esTreeNodeToTSNodeMap as unknown as NodeMap;
        const {sourceCode} = context;
        const program = sourceCode.ast as TSESTree.Program;

        return {
            CallExpression(node: TSESTree.CallExpression) {
                for (const scope of getReactiveScopes(node, program)) {
                    const reported = new Set<string>();

                    walkAfterAsyncBoundaryAst(scope.callback, (inner) => {
                        if (
                            inner.type !== AST_NODE_TYPES.CallExpression ||
                            isAngularUntrackedCall(inner, program) ||
                            !isSignalReadCall(inner, checker, esTreeNodeToTSNodeMap)
                        ) {
                            return;
                        }

                        const key = String(inner.range);

                        if (reported.has(key)) {
                            return;
                        }

                        reported.add(key);

                        context.report({
                            data: {
                                kind: scope.kind,
                                name: sourceCode.getText(inner),
                            },
                            messageId: 'readAfterAwait',
                            node: inner,
                        });
                    });
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow bare signal reads that occur after `await` inside reactive callbacks, because Angular no longer tracks them as dependencies',
            url: ANGULAR_SIGNALS_ASYNC_GUIDE_URL,
        },
        messages: {
            readAfterAwait:
                '`{{ name }}` is read after `await` inside `{{ kind }}`. Angular only tracks synchronous signal reads, so this dependency will not be tracked. Read it before `await` and store the snapshot, or wrap the post-`await` read in `untracked(...)` when you intentionally need the current value at that point. See Angular guide: https://angular.dev/guide/signals#reactive-context-and-async-operations',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-signal-reads-after-await-in-reactive-context',
});

export default rule;
