import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export {
    getLeadingIndentation,
    getLineBreak,
    hasBlankLine,
    hasCommentLikeText,
    isSingleLineNode,
} from './spacing';

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
