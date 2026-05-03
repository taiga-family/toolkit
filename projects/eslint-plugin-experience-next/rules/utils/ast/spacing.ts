import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

export function isSingleLineNode(node: TSESTree.Node): boolean {
    return node.loc.start.line === node.loc.end.line;
}

export function hasCommentLikeText(text: string): boolean {
    return text.includes('//') || text.includes('/*');
}

export function hasBlankLine(text: string): boolean {
    let lineBreaks = 0;

    for (let index = 0; index < text.length; index++) {
        const char = text[index];

        if (char === '\n') {
            lineBreaks++;
        } else if (char === '\r') {
            lineBreaks++;

            if (text[index + 1] === '\n') {
                index++;
            }
        }

        if (lineBreaks > 1) {
            return true;
        }
    }

    return false;
}

export function getLineBreak(text: string): string {
    if (text.includes('\r\n')) {
        return '\r\n';
    }

    if (text.includes('\r')) {
        return '\r';
    }

    return '\n';
}

export function getLeadingIndentation(text: string): string {
    let index = 0;

    while (index < text.length && (text[index] === ' ' || text[index] === '\t')) {
        index++;
    }

    return text.slice(0, index);
}

export function getSpacingReplacement(
    sourceCode: Readonly<TSESLint.SourceCode>,
    betweenText: string,
    nextLine: number,
    blankLineCount: number,
): string {
    const indentation = getLeadingIndentation(sourceCode.lines[nextLine - 1] ?? '');

    return `${getLineBreak(betweenText).repeat(blankLineCount + 1)}${indentation}`;
}
