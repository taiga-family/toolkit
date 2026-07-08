import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {getLineStartOffset, getNextLineStartOffset} from './spacing';

export type CommaSeparatedNode =
    | TSESTree.Expression
    | TSESTree.Property
    | TSESTree.SpreadElement;

function getCommaAfter(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
): TSESLint.AST.Token | null {
    const token = sourceCode.getTokenAfter(node);

    return token?.value === ',' ? token : null;
}

function getCommaBefore(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
): TSESLint.AST.Token | null {
    const token = sourceCode.getTokenBefore(node);

    return token?.value === ',' ? token : null;
}

function removeStandaloneLine(
    sourceCode: Readonly<TSESLint.SourceCode>,
    fixer: TSESLint.RuleFixer,
    node: TSESTree.Node,
): TSESLint.RuleFix {
    const lineStart = getLineStartOffset(sourceCode.text, node.range[0]);
    const nextLineStart = getNextLineStartOffset(sourceCode.text, node.range[1]);

    return fixer.removeRange([lineStart, nextLineStart]);
}

function isStandaloneListItem(
    node: TSESTree.Node,
    previousNode: TSESTree.Node | null,
    nextNode: TSESTree.Node | null,
): boolean {
    const startsOwnLine =
        previousNode === null || previousNode.loc.end.line < node.loc.start.line;

    const endsOwnLine = nextNode === null || nextNode.loc.start.line > node.loc.end.line;

    return startsOwnLine && endsOwnLine;
}

export function removeCommaSeparatedNode(
    sourceCode: Readonly<TSESLint.SourceCode>,
    fixer: TSESLint.RuleFixer,
    node: CommaSeparatedNode,
    previousNode: CommaSeparatedNode | null,
    nextNode: CommaSeparatedNode | null,
): TSESLint.RuleFix | null {
    if (isStandaloneListItem(node, previousNode, nextNode)) {
        return removeStandaloneLine(sourceCode, fixer, node);
    }

    const commaAfter = getCommaAfter(sourceCode, node);

    if (nextNode && commaAfter) {
        return fixer.removeRange([node.range[0], nextNode.range[0]]);
    }

    const commaBefore = getCommaBefore(sourceCode, node);

    if (commaBefore) {
        return fixer.removeRange([
            commaBefore.range[0],
            commaAfter?.range[1] ?? node.range[1],
        ]);
    }

    return commaAfter ? fixer.removeRange([node.range[0], commaAfter.range[1]]) : null;
}
