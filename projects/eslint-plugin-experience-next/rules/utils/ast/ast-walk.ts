import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export function isFunctionLike(node: TSESTree.Node): node is TSESTree.FunctionLike {
    return (
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression
    );
}

function getOrderedChildren(node: TSESTree.Node): readonly TSESTree.Node[] {
    if (isFunctionLike(node)) {
        const children: Array<TSESTree.Node | null | undefined> = [
            ...node.params,
            node.body,
        ];

        return children.filter(
            (child): child is TSESTree.Node => child !== undefined && child !== null,
        );
    }

    if (
        node.type === AST_NODE_TYPES.BlockStatement ||
        node.type === AST_NODE_TYPES.Program
    ) {
        return node.body;
    }

    if (node.type === AST_NODE_TYPES.IfStatement) {
        return node.alternate
            ? [node.test, node.consequent, node.alternate]
            : [node.test, node.consequent];
    }

    if (node.type === AST_NODE_TYPES.ConditionalExpression) {
        return [node.test, node.consequent, node.alternate];
    }

    if (node.type === AST_NODE_TYPES.WhileStatement) {
        return [node.test, node.body];
    }

    if (node.type === AST_NODE_TYPES.DoWhileStatement) {
        return [node.body, node.test];
    }

    if (node.type === AST_NODE_TYPES.ForStatement) {
        const children: Array<TSESTree.Node | null> = [
            node.init && 'type' in node.init ? node.init : null,
            node.test,
            node.update,
            node.body,
        ];

        return children.filter((child): child is TSESTree.Node => child !== null);
    }

    if (
        node.type === AST_NODE_TYPES.ForInStatement ||
        node.type === AST_NODE_TYPES.ForOfStatement
    ) {
        return [node.left as unknown as TSESTree.Node, node.right, node.body];
    }

    const children: TSESTree.Node[] = [];

    for (const key of Object.keys(node)) {
        if (key === 'parent') {
            continue;
        }

        const child = (node as unknown as Record<string, unknown>)[key];

        if (Array.isArray(child)) {
            for (const item of child) {
                if (item && typeof item === 'object' && 'type' in item) {
                    children.push(item as TSESTree.Node);
                }
            }
        } else if (child && typeof child === 'object' && 'type' in child) {
            children.push(child as TSESTree.Node);
        }
    }

    return children;
}

/**
 * Walks the synchronous portion of a reactive scope.
 *
 * - Stops descending into nested function boundaries, since they run in their
 *   own call context and should not be treated as reads/writes of the current
 *   reactive scope.
 * - Traverses the argument of `await`, because it is evaluated synchronously,
 *   then stops visiting subsequent sibling nodes in the current execution path.
 */
export function walkSynchronousAst(
    root: TSESTree.Node,
    visitor: (node: TSESTree.Node) => false | void,
): void {
    traverse(root, true);

    function traverse(node: TSESTree.Node, isRoot = false): boolean {
        if (visitor(node) === false || (!isRoot && isFunctionLike(node))) {
            return false;
        }

        if (node.type === AST_NODE_TYPES.AwaitExpression) {
            return traverse(node.argument, false) || true;
        }

        for (const child of getOrderedChildren(node)) {
            if (traverse(child, false)) {
                return true;
            }
        }

        return false;
    }
}

/**
 * Walks nodes that run after an async boundary inside a reactive callback.
 *
 * The traversal is intentionally conservative:
 * - it never descends into nested function boundaries
 * - it propagates async state through straight-line code
 * - it does not propagate branch-local `await` from optional control-flow
 *   bodies into later siblings, which avoids noisy false positives
 */
export function walkAfterAsyncBoundaryAst(
    root: TSESTree.Node,
    visitor: (node: TSESTree.Node) => void,
): void {
    traverse(root, true, false);

    function traverse(
        node: TSESTree.Node,
        isRoot = false,
        afterBoundary = false,
    ): boolean {
        if (afterBoundary) {
            visitor(node);
        }

        if (!isRoot && isFunctionLike(node)) {
            return false;
        }

        if (node.type === AST_NODE_TYPES.AwaitExpression) {
            traverse(node.argument, false, afterBoundary);

            return true;
        }

        if (
            node.type === AST_NODE_TYPES.BlockStatement ||
            node.type === AST_NODE_TYPES.Program
        ) {
            let crossed = afterBoundary;

            for (const child of node.body) {
                const childCrossed = traverse(child, false, crossed);

                crossed = crossed || childCrossed;
            }

            return crossed && !afterBoundary;
        }

        if (node.type === AST_NODE_TYPES.IfStatement) {
            const crossedInTest = traverse(node.test, false, afterBoundary);
            const branchAfterBoundary = afterBoundary || crossedInTest;

            traverse(node.consequent, false, branchAfterBoundary);

            if (node.alternate) {
                traverse(node.alternate, false, branchAfterBoundary);
            }

            return crossedInTest && !afterBoundary;
        }

        let crossed = afterBoundary;

        for (const child of getOrderedChildren(node)) {
            const childCrossed = traverse(child, false, crossed);

            crossed = crossed || childCrossed;
        }

        return crossed && !afterBoundary;
    }
}

/**
 * Shallow AST walker. Visits `root` and every descendant, skipping the
 * synthetic `parent` back-pointer to avoid cycles.
 *
 * If the visitor returns `false` for a node, that node's children are NOT
 * visited (prune / stop-descend). Any other return value (including `void`)
 * continues the walk.
 */
export function walkAst(
    root: TSESTree.Node,
    visitor: (node: TSESTree.Node) => false | void,
): void {
    if (visitor(root) === false) {
        return;
    }

    for (const key of Object.keys(root)) {
        if (key === 'parent') {
            continue;
        }

        const child = (root as unknown as Record<string, unknown>)[key];

        if (Array.isArray(child)) {
            for (const item of child) {
                if (item && typeof item === 'object' && 'type' in item) {
                    walkAst(item as TSESTree.Node, visitor);
                }
            }
        } else if (child && typeof child === 'object' && 'type' in child) {
            walkAst(child as TSESTree.Node, visitor);
        }
    }
}
