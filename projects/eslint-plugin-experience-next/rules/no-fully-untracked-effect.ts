import {type TSESTree} from '@typescript-eslint/utils';

import {
    collectSignalReadsInsideUntracked,
    collectSignalUsages,
    getReactiveScopes,
} from './utils/angular/angular-signals';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from './utils/angular/untracked-docs';
import {type NodeMap} from './utils/typescript/node-map';
import {getTypeAwareRuleContext} from './utils/typescript/type-aware-context';

type MessageId = 'noTrackedReads';

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, program} =
            getTypeAwareRuleContext(context);
        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;

        return {
            CallExpression(node: TSESTree.CallExpression) {
                for (const scope of getReactiveScopes(node, program)) {
                    const {reads: trackedReads} = collectSignalUsages(
                        scope.callback,
                        checker,
                        signalNodeMap,
                        program,
                    );

                    if (trackedReads.length > 0) {
                        continue;
                    }

                    const untrackedReads = collectSignalReadsInsideUntracked(
                        scope.callback,
                        checker,
                        signalNodeMap,
                        program,
                    );

                    if (untrackedReads.length === 0) {
                        continue;
                    }

                    context.report({
                        data: {kind: scope.kind},
                        messageId: 'noTrackedReads',
                        node: scope.reportNode,
                    });
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow reactive callbacks where all signal reads are inside `untracked()`, leaving the callback without tracked dependencies',
            url: ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
        },
        messages: {
            noTrackedReads:
                'This `{{ kind }}` callback has no tracked signal reads: every signal read is hidden inside `untracked()`, so changes will not re-run it. Move reads that should create dependencies outside `untracked()`. See Angular guide: https://angular.dev/guide/signals#reading-without-tracking-dependencies',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-fully-untracked-effect',
});

export default rule;
