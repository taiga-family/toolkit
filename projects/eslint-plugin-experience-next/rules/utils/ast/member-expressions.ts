import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

export function getSafeBracketIndexText(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.MemberExpression,
): string | null {
    if (!node.computed || node.property.type !== AST_NODE_TYPES.Literal) {
        return null;
    }

    const {value} = node.property;

    if (typeof value !== 'number') {
        return null;
    }

    const hasSameAtIndexSemantics = Number.isInteger(value) && value >= 0;

    return hasSameAtIndexSemantics ? sourceCode.getText(node.property) : null;
}

export function getMemberAccessStart(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.MemberExpression,
): number | null {
    const tokenBeforeProperty = sourceCode.getTokenBefore(node.property);

    if (!tokenBeforeProperty) {
        return null;
    }

    if (!node.computed) {
        return tokenBeforeProperty.range[0];
    }

    if (tokenBeforeProperty.value !== '[') {
        return null;
    }

    const tokenBeforeBracket = sourceCode.getTokenBefore(tokenBeforeProperty);
    const hasOptionalBracketAccess = node.optional && tokenBeforeBracket?.value === '?.';

    return hasOptionalBracketAccess
        ? tokenBeforeBracket.range[0]
        : tokenBeforeProperty.range[0];
}

export function isSameIndexedAccess(
    sourceCode: Readonly<TSESLint.SourceCode>,
    left: TSESTree.MemberExpression,
    right: TSESTree.MemberExpression,
): boolean {
    const leftIndexText = getSafeBracketIndexText(sourceCode, left);
    const rightIndexText = getSafeBracketIndexText(sourceCode, right);

    return (
        leftIndexText !== null &&
        leftIndexText === rightIndexText &&
        sourceCode.getText(left.object) === sourceCode.getText(right.object)
    );
}
