import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

export function isSingleLineNode(node: TSESTree.Node): boolean {
    return node.loc.start.line === node.loc.end.line;
}

export function isLineBreakCharacter(char: string | undefined): boolean {
    return char === '\n' || char === '\r';
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

    return text.includes('\r') ? '\r' : '\n';
}

export function hasLineBreak(text: string): boolean {
    for (const char of text) {
        if (isLineBreakCharacter(char)) {
            return true;
        }
    }

    return false;
}

export function getLeadingIndentation(text: string): string {
    let index = 0;

    while (index < text.length && (text[index] === ' ' || text[index] === '\t')) {
        index++;
    }

    return text.slice(0, index);
}

export function getLineStartOffset(text: string, offset: number): number {
    let index = offset - 1;

    while (index >= 0) {
        const char = text[index];

        if (isLineBreakCharacter(char)) {
            return index + 1;
        }

        index--;
    }

    return 0;
}

export function getLineEndOffset(text: string, lineStartOffset: number): number {
    let index = lineStartOffset;

    while (index < text.length) {
        const char = text[index];

        if (isLineBreakCharacter(char)) {
            return index;
        }

        index++;
    }

    return text.length;
}

export function getNextLineStartOffset(text: string, offset: number): number {
    let index = offset;

    while (index < text.length) {
        const char = text[index];

        if (char === '\r') {
            return text[index + 1] === '\n' ? index + 2 : index + 1;
        }

        if (char === '\n') {
            return index + 1;
        }

        index++;
    }

    return offset;
}

export function splitLines(text: string): string[] {
    return text.split(/\r\n|\n|\r/);
}

export function getIndentAtOffset(text: string, offset: number): string {
    const lineStart = getLineStartOffset(text, offset);
    const indent = text.slice(lineStart, offset);

    return indent.trim() === '' ? indent : '';
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
