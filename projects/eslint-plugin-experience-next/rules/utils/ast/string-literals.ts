import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export type StringLiteral = TSESTree.Literal & {value: string};

export type StaticStringNode = StringLiteral | TSESTree.TemplateLiteral;

export function isStringLiteral(
    node: TSESTree.Node | null | undefined,
): node is StringLiteral {
    return node?.type === AST_NODE_TYPES.Literal && typeof node.value === 'string';
}

export function isStaticTemplateLiteral(
    node: TSESTree.Node | null | undefined,
): node is TSESTree.TemplateLiteral {
    return (
        node?.type === AST_NODE_TYPES.TemplateLiteral &&
        node.expressions.length === 0 &&
        node.quasis.length === 1
    );
}

export function isStaticString(
    node: TSESTree.Node | null | undefined,
): node is StaticStringNode {
    return isStringLiteral(node) || isStaticTemplateLiteral(node);
}

export function getStaticStringValue(
    node: TSESTree.Node | null | undefined,
): string | null {
    if (isStringLiteral(node)) {
        return node.value;
    }

    if (!isStaticTemplateLiteral(node)) {
        return null;
    }

    return node.quasis[0]?.value.cooked ?? node.quasis[0]?.value.raw ?? '';
}

export function isEmptyStaticString(node: TSESTree.Node | null | undefined): boolean {
    return getStaticStringValue(node) === '';
}
