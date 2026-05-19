import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export {
    getLeadingIndentation,
    getLineBreak,
    getLineStartOffset,
    hasBlankLine,
    hasCommentLikeText,
    isSingleLineNode,
} from './spacing';

export type FieldLikeMember =
    | TSESTree.PropertyDefinition
    | TSESTree.TSAbstractPropertyDefinition;

export type AccessibilityGroup = 'private' | 'protected' | 'public';

export type AccessibilityClassMember =
    | TSESTree.AccessorProperty
    | TSESTree.MethodDefinition
    | TSESTree.PropertyDefinition
    | TSESTree.TSAbstractAccessorProperty
    | TSESTree.TSAbstractMethodDefinition
    | TSESTree.TSAbstractPropertyDefinition
    | TSESTree.TSIndexSignature;

export type EcmascriptPrivateClassMember = Exclude<
    AccessibilityClassMember,
    TSESTree.TSIndexSignature
> & {
    readonly key: TSESTree.PrivateIdentifier;
};

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

export function isAccessibilityClassMember(
    member: TSESTree.ClassElement,
): member is AccessibilityClassMember {
    switch (member.type) {
        case AST_NODE_TYPES.AccessorProperty:
        case AST_NODE_TYPES.MethodDefinition:
        case AST_NODE_TYPES.PropertyDefinition:
        case AST_NODE_TYPES.TSAbstractAccessorProperty:
        case AST_NODE_TYPES.TSAbstractMethodDefinition:
        case AST_NODE_TYPES.TSAbstractPropertyDefinition:
        case AST_NODE_TYPES.TSIndexSignature:
            return true;
        default:
            return false;
    }
}

export function isEcmascriptPrivateClassMember(
    member: TSESTree.ClassElement,
): member is EcmascriptPrivateClassMember {
    return 'key' in member && member.key.type === AST_NODE_TYPES.PrivateIdentifier;
}

export function getAccessibilityGroup(
    member: AccessibilityClassMember,
): AccessibilityGroup {
    return isEcmascriptPrivateClassMember(member)
        ? 'private'
        : (member.accessibility ?? 'public');
}
