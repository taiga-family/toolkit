import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {
    getReactiveScopes,
    isAngularUntrackedCall,
    isSignalReadCall,
    walkAfterAsyncBoundaryAst,
} from './utils/angular/angular-signals';
import {
    ANGULAR_SIGNALS_ASYNC_GUIDE_URL,
    createUntrackedRule,
} from './utils/angular/untracked-docs';
import {type NodeMap} from './utils/typescript/node-map';
import {getTypeAwareRuleContext} from './utils/typescript/type-aware-context';

type MessageId = 'readAfterAwait';

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, program, sourceCode} =
            getTypeAwareRuleContext(context);
        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;

        return {
            CallExpression(node: TSESTree.CallExpression) {
                for (const scope of getReactiveScopes(node, program)) {
                    const reported = new Set<string>();

                    walkAfterAsyncBoundaryAst(scope.callback, (inner) => {
                        if (
                            inner.type !== AST_NODE_TYPES.CallExpression ||
                            isAngularUntrackedCall(inner, program) ||
                            !isSignalReadCall(inner, checker, signalNodeMap)
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
