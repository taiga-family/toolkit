import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {
    collectSignalUsages,
    getReactiveScopes,
    isAngularUntrackedCall,
    isSignalReadCall,
    type NodeMap,
    walkSynchronousAst,
} from './utils/angular-signals';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from './utils/untracked-docs';

type MessageId = 'noTrackedReads';

/**
 * Collects signal reads that appear inside `untracked(...)` callbacks within
 * `root`, without descending into nested `untracked(...)` scopes.
 */
function collectReadsInsideUntracked(
    root: TSESTree.Node,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
    program: TSESTree.Program,
): TSESTree.CallExpression[] {
    const reads: TSESTree.CallExpression[] = [];

    walkSynchronousAst(root, (node) => {
        if (node.type !== AST_NODE_TYPES.CallExpression) {
            return;
        }

        if (!isAngularUntrackedCall(node, program)) {
            return;
        }

        const [arg] = node.arguments;

        if (
            !arg ||
            (arg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
                arg.type !== AST_NODE_TYPES.FunctionExpression)
        ) {
            return false;
        }

        walkSynchronousAst(arg, (inner) => {
            if (
                inner.type === AST_NODE_TYPES.CallExpression &&
                isSignalReadCall(inner, checker, esTreeNodeToTSNodeMap)
            ) {
                reads.push(inner);
            }
        });

        return false; // Do not descend into nested untracked from the outer walk
    });

    return reads;
}

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
                    const {reads: trackedReads} = collectSignalUsages(
                        scope.callback,
                        checker,
                        esTreeNodeToTSNodeMap,
                        program,
                    );

                    if (trackedReads.length > 0) {
                        continue;
                    }

                    const untrackedReads = collectReadsInsideUntracked(
                        scope.callback,
                        checker,
                        esTreeNodeToTSNodeMap,
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
