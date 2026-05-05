import {AST_NODE_TYPES} from '@typescript-eslint/utils';

import {type ClassLike} from '../ast/ancestors';

export function hasNamedDecorator(node: ClassLike, name: string): boolean {
    return node.decorators.some((decorator) => {
        const expression = decorator.expression;

        return expression.type === AST_NODE_TYPES.Identifier
            ? expression.name === name
            : expression.type === AST_NODE_TYPES.CallExpression &&
                  expression.callee.type === AST_NODE_TYPES.Identifier &&
                  expression.callee.name === name;
    });
}
