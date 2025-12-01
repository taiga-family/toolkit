import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';

import {isObject} from './is-object';

/**
 * Extracts the metadata object from a class decorator such as
 * `@Component()`, `@Directive()`, `@NgModule()`, or `@Pipe()`.
 *
 * Returns the first argument of the decorator call *if and only if*
 * it is an `ObjectExpression`.
 *
 * @example
 * // Given:
 * @Component({
 *   selector: 'x',
 *   imports: [A, B],
 * })
 * class MyCmp {}
 *
 * // In the AST for @Component(...)
 * getDecoratorMetadata(decorator, allowed) →
 *    ObjectExpression({ selector: ..., imports: ... })
 *
 * @param decorator - The decorator node attached to a class declaration.
 * @param allowedNames - A set of decorator names to consider
 *                       (e.g., Component, Directive, NgModule, Pipe).
 *
 * @returns The metadata `ObjectExpression` if present and valid,
 *          otherwise `null`.
 */
export function getDecoratorMetadata(
    decorator: TSESTree.Decorator,
    allowedNames: Set<string>,
): TSESTree.ObjectExpression | null {
    const expr = decorator.expression;

    if (expr.type !== AST_NODE_TYPES.CallExpression) {
        return null;
    }

    const callee = expr.callee;

    if (callee.type !== AST_NODE_TYPES.Identifier) {
        return null;
    }

    if (!allowedNames.has(callee.name)) {
        return null;
    }

    const arg = expr.arguments[0];

    return isObject(arg) ? arg : null;
}
