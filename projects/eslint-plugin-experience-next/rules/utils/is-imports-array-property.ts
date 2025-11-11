import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export function isImportsArrayProperty(
    property?: TSESTree.Property,
): property is TSESTree.Property & {value: TSESTree.ArrayExpression} {
    const isProperty = property?.type === AST_NODE_TYPES.Property;
    const hasIdentifierKey =
        property?.key.type === AST_NODE_TYPES.Identifier &&
        property.key.name === 'imports';
    const hasArrayValue = property?.value.type === AST_NODE_TYPES.ArrayExpression;

    return isProperty && hasIdentifierKey && hasArrayValue;
}
