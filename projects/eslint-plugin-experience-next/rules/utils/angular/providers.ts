import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getObjectPropertyName} from '../ast/property-names';
import {getLocalNameForImport} from './angular-imports';

export function isAngularInjectionTokenFactoryFunction(
    fn: TSESTree.FunctionLike,
    program: TSESTree.Program,
): boolean {
    const parent = fn.parent;
    const injectionTokenName = getLocalNameForImport(
        program,
        '@angular/core',
        'InjectionToken',
    );

    if (
        !injectionTokenName ||
        parent.type !== AST_NODE_TYPES.Property ||
        getObjectPropertyName(parent) !== 'factory'
    ) {
        return false;
    }

    const objectExpression = parent.parent;

    return (
        objectExpression.type === AST_NODE_TYPES.ObjectExpression &&
        objectExpression.parent.type === AST_NODE_TYPES.NewExpression &&
        objectExpression.parent.arguments.includes(objectExpression) &&
        objectExpression.parent.callee.type === AST_NODE_TYPES.Identifier &&
        objectExpression.parent.callee.name === injectionTokenName
    );
}

export function isAngularUseFactoryFunction(fn: TSESTree.FunctionLike): boolean {
    const parent = fn.parent;

    if (
        parent.type !== AST_NODE_TYPES.Property ||
        getObjectPropertyName(parent) !== 'useFactory'
    ) {
        return false;
    }

    const objectExpression = parent.parent;

    return (
        objectExpression.type === AST_NODE_TYPES.ObjectExpression &&
        objectExpression.properties.some(
            (property) =>
                property.type === AST_NODE_TYPES.Property &&
                getObjectPropertyName(property) === 'provide',
        )
    );
}
