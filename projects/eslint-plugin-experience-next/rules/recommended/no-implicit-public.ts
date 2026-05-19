import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {getEnclosingClass} from '../utils/ast/ancestors';
import {isEcmascriptPrivateClassMember} from '../utils/ast/class-members';
import {getStaticPropertyName} from '../utils/ast/property-names';
import {createRule} from '../utils/create-rule';

type ImplicitPublicCandidate =
    | TSESTree.MethodDefinition
    | TSESTree.PropertyDefinition
    | TSESTree.TSParameterProperty;

type ClassMemberCandidate = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

interface PublicModifierInsertion {
    readonly range: TSESTree.Range;
    readonly text: string;
}

function isClassMemberCandidate(
    node: ImplicitPublicCandidate,
): node is ClassMemberCandidate {
    return (
        node.type === AST_NODE_TYPES.MethodDefinition ||
        node.type === AST_NODE_TYPES.PropertyDefinition
    );
}

function isConstructorMember(node: ImplicitPublicCandidate): boolean {
    return node.type === AST_NODE_TYPES.MethodDefinition && node.kind === 'constructor';
}

function getParameterPropertyName(node: TSESTree.TSParameterProperty): string | null {
    const {parameter} = node;

    return parameter.type === AST_NODE_TYPES.Identifier
        ? parameter.name
        : parameter.left.name;
}

function getCandidateName(node: ImplicitPublicCandidate): string {
    return node.type === AST_NODE_TYPES.TSParameterProperty
        ? (getParameterPropertyName(node) ?? 'member')
        : (getStaticPropertyName(node.key) ?? 'member');
}

function getCandidateKind(node: ImplicitPublicCandidate): string {
    return node.type === AST_NODE_TYPES.MethodDefinition ? node.kind : 'property';
}

function getFirstNonWhitespaceOffset(text: string, offset: number): number {
    let index = offset;

    while (index < text.length && text[index]?.trim() === '') {
        index++;
    }

    return index;
}

function getPublicModifierInsertion(options: {
    node: ImplicitPublicCandidate;
    sourceCode: Readonly<TSESLint.SourceCode>;
}): PublicModifierInsertion {
    const {node, sourceCode} = options;
    const lastDecoratorIndex = node.decorators.length - 1;
    const lastDecorator = node.decorators[lastDecoratorIndex];

    if (lastDecorator) {
        const [, end] = lastDecorator.range;
        const memberStart = getFirstNonWhitespaceOffset(sourceCode.text, end);
        const hasWhitespaceAfterDecorator = memberStart > end;

        return {
            range: [memberStart, memberStart],
            text: hasWhitespaceAfterDecorator ? 'public ' : ' public ',
        };
    }

    return {
        range: [node.range[0], node.range[0]],
        text: 'public ',
    };
}

export const rule = createRule({
    create(context) {
        const sourceCode = context.sourceCode;

        const checkImplicitPublic = (node: ImplicitPublicCandidate): void => {
            const classRef = getEnclosingClass(node);

            if (!classRef) {
                return;
            }

            const privateNameCannotBePublic =
                isClassMemberCandidate(node) && isEcmascriptPrivateClassMember(node);

            if (
                isConstructorMember(node) ||
                Boolean(node.accessibility) ||
                privateNameCannotBePublic
            ) {
                return;
            }

            context.report({
                data: {
                    kind: getCandidateKind(node),
                    name: getCandidateName(node),
                },
                fix: (fixer) => {
                    const {range, text} = getPublicModifierInsertion({
                        node,
                        sourceCode,
                    });

                    return fixer.insertTextBeforeRange(range, text);
                },
                messageId: 'implicitPublic',
                node,
            });
        };

        return {
            MethodDefinition(node: TSESTree.MethodDefinition) {
                checkImplicitPublic(node);
            },
            PropertyDefinition(node: TSESTree.PropertyDefinition) {
                checkImplicitPublic(node);
            },
            TSParameterProperty(node: TSESTree.TSParameterProperty) {
                checkImplicitPublic(node);
            },
        };
    },
    meta: {
        docs: {
            description:
                'Require explicit `public` modifier for class members and parameter properties',
        },
        fixable: 'code',
        messages: {implicitPublic: '{{kind}} {{name}} should be marked as public'},
        schema: [],
        type: 'problem',
    },
    name: 'no-implicit-public',
});

export default rule;
