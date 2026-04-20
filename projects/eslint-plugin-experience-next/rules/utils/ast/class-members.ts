import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export type FieldLikeMember =
    | TSESTree.PropertyDefinition
    | TSESTree.TSAbstractPropertyDefinition;

export function isFieldLikeMember(
    member: TSESTree.ClassElement,
): member is FieldLikeMember {
    return (
        member.type === AST_NODE_TYPES.PropertyDefinition ||
        member.type === AST_NODE_TYPES.TSAbstractPropertyDefinition
    );
}

export function isAccessorMember(
    member: TSESTree.ClassElement,
): member is TSESTree.MethodDefinition {
    return (
        member.type === AST_NODE_TYPES.MethodDefinition &&
        (member.kind === 'get' || member.kind === 'set')
    );
}

export function isRelevantSpacingClassMember(
    member: TSESTree.ClassElement,
): member is FieldLikeMember | TSESTree.MethodDefinition {
    return isFieldLikeMember(member) || isAccessorMember(member);
}

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
