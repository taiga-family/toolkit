import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getStaticStringValue} from './string-literals';

export function getStaticPropertyName(key: TSESTree.PropertyName): string | null {
    if (key.type === AST_NODE_TYPES.Identifier) {
        return key.name;
    }

    return key.type === AST_NODE_TYPES.Literal &&
        (typeof key.value === 'string' || typeof key.value === 'number')
        ? String(key.value)
        : getStaticStringValue(key);
}

export function getObjectPropertyName(node: TSESTree.Property): string | null {
    return node.computed ? null : getStaticPropertyName(node.key);
}

export function getMemberExpressionPropertyName(
    node: TSESTree.MemberExpression,
): string | null {
    if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
        return node.property.name;
    }

    return node.computed ? getStaticStringValue(node.property) : null;
}

export function getClassMemberName(
    member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition,
): string | null {
    return member.key.type === AST_NODE_TYPES.PrivateIdentifier
        ? null
        : getStaticPropertyName(member.key);
}
