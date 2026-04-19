import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {isSpread} from './is-spread';

/**
 * Returns a readable string representation of an import element
 * inside Angular standalone metadata (`imports: [...]`).
 *
 * Supports:
 * - Identifier → "A"
 * - MemberExpression → "A.B"
 * - SpreadElement → "...A"
 * - Any other expression → full source text fallback
 *
 * @example
 * nameOf(Identifier("A"), source)                 // "A"
 * nameOf(MemberExpression(A.B), source)           // "A.B"
 * nameOf(SpreadElement(Identifier("A")), source)  // "...A"
 * nameOf(SpreadElement(Member(A.B)), source)      // "...A.B"
 * nameOf(CallExpression(foo()), source)           // "foo()"
 */
export function nameOf(
    node: TSESTree.Expression | TSESTree.SpreadElement,
    source: Readonly<TSESLint.SourceCode>,
): string {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return node.name;
    }

    if (isSpread(node)) {
        return `...${nameOf(node.argument, source)}`;
    }

    if (
        node.type === AST_NODE_TYPES.MemberExpression &&
        !node.computed &&
        node.property.type === AST_NODE_TYPES.Identifier
    ) {
        const obj =
            node.object.type === AST_NODE_TYPES.Identifier
                ? node.object.name
                : source.getText(node.object);

        return `${obj}.${node.property.name}`;
    }

    return source.getText(node);
}
