import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {hasNonNullAssertionParent} from '../utils/ast/ast-expressions';
import {isFunctionExpressionLike, walkAst} from '../utils/ast/ast-walk';
import {
    isConditionTestExpression,
    isEqualityComparisonOperand,
    isLogicalFallbackLeftOperand,
} from '../utils/ast/condition-expressions';
import {isIndexedAccessGuardingSameIndexAssignment} from '../utils/ast/indexed-access-narrowing';
import {
    getMemberAccessStart,
    getSafeBracketIndexText,
} from '../utils/ast/member-expressions';
import {isMutationTarget} from '../utils/ast/mutation-targets';
import {
    getMemberExpressionPropertyName,
    getStaticPropertyName,
} from '../utils/ast/property-names';
import {getIndentAtOffset, getLineBreak, getLineStartOffset} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';
import {hasVariableInScope} from '../utils/eslint/scope';
import {hasBuiltInAtReceiverType} from '../utils/typescript/built-in-at';
import {supportsBuiltInAt} from '../utils/typescript/compiler-options';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';
import {hasNullishType, isKnownTupleType} from '../utils/typescript/types';

type Options = [];

type MessageId = 'atCompatAvoidAt' | 'atCompatPreferAt';

type AtCallExpression = TSESTree.CallExpression & {
    callee: TSESTree.MemberExpression;
};

interface NonNegativeAtIndex {
    readonly text: string;
    readonly type: 'nonNegative';
}

interface LastAtIndex {
    readonly type: 'last';
}

type AtIndex = LastAtIndex | NonNegativeAtIndex;

type SupportedStatement = Extract<
    TSESTree.Statement,
    {
        readonly type:
            | AST_NODE_TYPES.ExpressionStatement
            | AST_NODE_TYPES.ReturnStatement
            | AST_NODE_TYPES.ThrowStatement
            | AST_NODE_TYPES.VariableDeclaration;
    }
>;

const SUPPORTED_STATEMENT_TYPES = new Set<AST_NODE_TYPES>([
    AST_NODE_TYPES.ExpressionStatement,
    AST_NODE_TYPES.ReturnStatement,
    AST_NODE_TYPES.ThrowStatement,
    AST_NODE_TYPES.VariableDeclaration,
]);

function getAtCall(node: TSESTree.MemberExpression): AtCallExpression | null {
    const {parent} = node;

    const isSafeAtCall =
        parent.type === AST_NODE_TYPES.CallExpression &&
        parent.callee === node &&
        !parent.optional;

    return isSafeAtCall ? (parent as AtCallExpression) : null;
}

function getAtIndex(
    sourceCode: Readonly<TSESLint.SourceCode>,
    call: TSESTree.CallExpression,
): AtIndex | null {
    if (call.arguments.length === 0) {
        return {text: '0', type: 'nonNegative'};
    }

    if (call.arguments.length > 1) {
        return null;
    }

    const [index] = call.arguments;

    if (!index) {
        return null;
    }

    const isLastIndex =
        index.type === AST_NODE_TYPES.UnaryExpression &&
        index.operator === '-' &&
        index.argument.type === AST_NODE_TYPES.Literal &&
        index.argument.value === 1;

    if (isLastIndex) {
        return {type: 'last'};
    }

    if (index.type !== AST_NODE_TYPES.Literal || typeof index.value !== 'number') {
        return null;
    }

    const hasSameBracketIndexSemantics =
        Number.isInteger(index.value) && index.value >= 0;

    return hasSameBracketIndexSemantics
        ? {text: sourceCode.getText(index), type: 'nonNegative'}
        : null;
}

function appendAtFallback(
    node: TSESTree.MemberExpression,
    atCallText: string,
    indexedAccessTypeAlreadyIncludesUndefined: boolean,
): string {
    if (indexedAccessTypeAlreadyIncludesUndefined) {
        return atCallText;
    }

    const canUseSurroundingFallback =
        isLogicalFallbackLeftOperand(node) ||
        isConditionTestExpression(node) ||
        isEqualityComparisonOperand(node);

    return node.optional || canUseSurroundingFallback || hasNonNullAssertionParent(node)
        ? atCallText
        : `${atCallText}!`;
}

function getAtCallText(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.MemberExpression,
    indexText: string,
    useOptionalAccess: boolean,
): string | null {
    const accessStart = getMemberAccessStart(sourceCode, node);

    if (accessStart === null) {
        return null;
    }

    const objectText = sourceCode.text.slice(node.range[0], accessStart);
    const access = useOptionalAccess ? '?.' : '.';

    return `${objectText}${access}at(${indexText})`;
}

function isRepeatableReceiver(node: TSESTree.Expression): boolean {
    switch (node.type) {
        case AST_NODE_TYPES.Identifier:
        case AST_NODE_TYPES.ThisExpression:
            return true;

        case AST_NODE_TYPES.MemberExpression:
            return !node.optional && !node.computed && isRepeatableReceiver(node.object);

        default:
            return false;
    }
}

function capitalize(value: string): string {
    return value.length > 0 ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value;
}

function getExpressionName(node: TSESTree.Node): string | null {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return node.name;
    }

    return node.type === AST_NODE_TYPES.MemberExpression &&
        !node.computed &&
        node.property.type === AST_NODE_TYPES.Identifier
        ? node.property.name
        : null;
}

function pluralize(value: string): string {
    return value.endsWith('s') ? value : `${value}s`;
}

function sanitizeIdentifierName(value: string): string {
    const sanitized = value.replaceAll(/[^\w$]/g, '');
    const canUseSanitizedName = /^[A-Z_$][\w$]*$/i.test(sanitized);

    return canUseSanitizedName ? sanitized : 'atCompatValue';
}

function getPreferredTemporaryNames(node: TSESTree.Expression): readonly string[] {
    if (
        node.type !== AST_NODE_TYPES.CallExpression ||
        node.callee.type !== AST_NODE_TYPES.MemberExpression
    ) {
        return ['atCompatValue'];
    }

    const methodName = getMemberExpressionPropertyName(node.callee);
    const receiverName = getExpressionName(node.callee.object);

    if (methodName === 'split' && receiverName) {
        const pluralName = sanitizeIdentifierName(pluralize(receiverName));
        const listName = sanitizeIdentifierName(`${receiverName}List`);

        return pluralName === listName ? [pluralName] : [pluralName, listName];
    }

    const isObjectValuesCall = receiverName === 'Object' && methodName === 'values';
    const [firstArgument] = node.arguments;

    if (isObjectValuesCall && firstArgument) {
        const argumentName = getExpressionName(firstArgument);

        return [
            argumentName ? sanitizeIdentifierName(`${argumentName}Values`) : 'values',
        ];
    }

    return [
        receiverName && methodName
            ? sanitizeIdentifierName(`${receiverName}${capitalize(methodName)}`)
            : 'atCompatValue',
    ];
}

function getClassElementName(member: TSESTree.ClassElement): string | null {
    if (!('key' in member)) {
        return null;
    }

    return member.key.type === AST_NODE_TYPES.PrivateIdentifier
        ? member.key.name
        : getStaticPropertyName(member.key);
}

function hasClassElementName(classBody: TSESTree.ClassBody, name: string): boolean {
    return classBody.body.some((member) => getClassElementName(member) === name);
}

function isTemporaryNameTaken(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
    name: string,
    classBody: TSESTree.ClassBody | null,
): boolean {
    const hasClassNameCollision = classBody
        ? hasClassElementName(classBody, name)
        : false;

    return hasVariableInScope(sourceCode, node, name) || hasClassNameCollision;
}

function getAvailableTemporaryName(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
    preferredNames: readonly string[],
    classBody: TSESTree.ClassBody | null,
): string {
    for (const candidate of preferredNames) {
        if (!isTemporaryNameTaken(sourceCode, node, candidate, classBody)) {
            return candidate;
        }
    }

    const fallbackName = preferredNames[preferredNames.length - 1] ?? 'atCompatValue';
    let name = fallbackName;
    let index = 2;
    let isNameTaken = isTemporaryNameTaken(sourceCode, node, name, classBody);

    while (isNameTaken) {
        name = `${fallbackName}${index}`;
        index++;
        isNameTaken = isTemporaryNameTaken(sourceCode, node, name, classBody);
    }

    return name;
}

function isSupportedStatement(node: TSESTree.Node): node is SupportedStatement {
    return SUPPORTED_STATEMENT_TYPES.has(node.type);
}

function getSupportedStatement(node: TSESTree.Node): TSESTree.Statement | null {
    let current = node.parent;

    while (current) {
        if (isFunctionExpressionLike(current)) {
            return null;
        }

        const {parent} = current;

        if (!parent) {
            return null;
        }

        const hasSupportedStatementParent =
            parent.type === AST_NODE_TYPES.BlockStatement ||
            parent.type === AST_NODE_TYPES.Program;

        if (isSupportedStatement(current) && hasSupportedStatementParent) {
            return current;
        }

        current = current.parent;
    }

    return null;
}

function isNonRepeatableLastAtCall(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
): boolean {
    if (
        node.type !== AST_NODE_TYPES.CallExpression ||
        node.callee.type !== AST_NODE_TYPES.MemberExpression ||
        getMemberExpressionPropertyName(node.callee) !== 'at'
    ) {
        return false;
    }

    const call = getAtCall(node.callee);
    const index = getAtIndex(sourceCode, node);

    return (
        call === node &&
        index?.type === 'last' &&
        !node.callee.optional &&
        !isRepeatableReceiver(node.callee.object)
    );
}

function hasMultipleNonRepeatableLastAtCalls(
    sourceCode: Readonly<TSESLint.SourceCode>,
    root: TSESTree.Node,
): boolean {
    let count = 0;

    walkAst(root, (node) => {
        if (node !== root && isFunctionExpressionLike(node)) {
            return false;
        }

        if (isNonRepeatableLastAtCall(sourceCode, node)) {
            count++;
        }

        return;
    });

    return count > 1;
}

function getClassPropertyWithoutFunctionBoundary(
    node: TSESTree.Node,
): TSESTree.PropertyDefinition | null {
    let current = node.parent;

    while (current) {
        if (current.type === AST_NODE_TYPES.PropertyDefinition) {
            return current;
        }

        if (isFunctionExpressionLike(current)) {
            return null;
        }

        current = current.parent;
    }

    return null;
}

function getClassPropertyPrefix(property: TSESTree.PropertyDefinition): string {
    if (property.key.type === AST_NODE_TYPES.PrivateIdentifier) {
        return property.static ? 'static ' : '';
    }

    const modifiers = [
        property.accessibility,
        property.static ? 'static' : null,
        'readonly',
    ].filter((modifier): modifier is string => Boolean(modifier));

    return `${modifiers.join(' ')} `;
}

function getClassPropertyDeclarationName(
    property: TSESTree.PropertyDefinition,
    name: string,
): string {
    return property.key.type === AST_NODE_TYPES.PrivateIdentifier ? `#${name}` : name;
}

function getClassPropertyReceiver(
    property: TSESTree.PropertyDefinition,
    name: string,
): string {
    return property.key.type === AST_NODE_TYPES.PrivateIdentifier
        ? `this.#${name}`
        : `this.${name}`;
}

function getLastIndexFix(
    fixer: TSESLint.RuleFixer,
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.MemberExpression,
    call: TSESTree.CallExpression,
): TSESLint.RuleFix | TSESLint.RuleFix[] | null {
    if (node.optional) {
        return null;
    }

    const objectText = sourceCode.getText(node.object);

    if (isRepeatableReceiver(node.object)) {
        return fixer.replaceText(call, `${objectText}[${objectText}.length - 1]`);
    }

    const preferredNames = getPreferredTemporaryNames(node.object);
    const statement = getSupportedStatement(call);

    if (statement) {
        if (hasMultipleNonRepeatableLastAtCalls(sourceCode, statement)) {
            return null;
        }

        const temporaryName = getAvailableTemporaryName(
            sourceCode,
            call,
            preferredNames,
            null,
        );

        const indent = getIndentAtOffset(sourceCode.text, statement.range[0]);
        const lineStart = getLineStartOffset(sourceCode.text, statement.range[0]);
        const lineBreak = getLineBreak(sourceCode.text);

        return [
            fixer.insertTextBeforeRange(
                [lineStart, lineStart],
                `${indent}const ${temporaryName} = ${objectText};${lineBreak}`,
            ),
            fixer.replaceText(call, `${temporaryName}[${temporaryName}.length - 1]`),
        ];
    }

    const property = getClassPropertyWithoutFunctionBoundary(call);

    const classBody =
        property?.parent.type === AST_NODE_TYPES.ClassBody ? property.parent : null;

    if (property && classBody) {
        if (hasMultipleNonRepeatableLastAtCalls(sourceCode, property)) {
            return null;
        }

        const propertyName = getAvailableTemporaryName(
            sourceCode,
            call,
            preferredNames,
            classBody,
        );

        const declarationName = getClassPropertyDeclarationName(property, propertyName);
        const receiverText = getClassPropertyReceiver(property, propertyName);
        const indent = getIndentAtOffset(sourceCode.text, property.range[0]);
        const lineStart = getLineStartOffset(sourceCode.text, property.range[0]);
        const lineBreak = getLineBreak(sourceCode.text);

        return [
            fixer.insertTextBeforeRange(
                [lineStart, lineStart],
                `${indent}${getClassPropertyPrefix(property)}${declarationName} = ${objectText};${lineBreak}${lineBreak}`,
            ),
            fixer.replaceText(call, `${receiverText}[${receiverText}.length - 1]`),
        ];
    }

    return null;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const typeAwareContext = getTypeAwareRuleContext(context);
        const compilerOptions = typeAwareContext.tsProgram.getCompilerOptions();
        const canUseAt = supportsBuiltInAt(compilerOptions);
        const {checker: typeChecker, esTreeNodeToTSNodeMap} = typeAwareContext;
        const {sourceCode} = context;

        return {
            MemberExpression(node: TSESTree.MemberExpression) {
                if (canUseAt) {
                    const indexText = getSafeBracketIndexText(sourceCode, node);

                    if (indexText === null || isMutationTarget(node)) {
                        return;
                    }

                    const tsObjectNode = esTreeNodeToTSNodeMap.get(node.object);
                    const tsIndexedAccessNode = esTreeNodeToTSNodeMap.get(node);
                    const objectType = typeChecker.getTypeAtLocation(tsObjectNode);

                    const indexedAccessType =
                        typeChecker.getTypeAtLocation(tsIndexedAccessNode);

                    const indexedAccessTypeAlreadyIncludesUndefined =
                        compilerOptions.noUncheckedIndexedAccess === true &&
                        hasNullishType(indexedAccessType);

                    const shouldPreserveIndexedAccessNarrowing =
                        indexedAccessTypeAlreadyIncludesUndefined &&
                        isIndexedAccessGuardingSameIndexAssignment(sourceCode, node);

                    const shouldSkipPreferAt =
                        !hasBuiltInAtReceiverType(typeChecker, objectType) ||
                        isKnownTupleType(typeChecker, objectType) ||
                        shouldPreserveIndexedAccessNarrowing;

                    if (shouldSkipPreferAt) {
                        return;
                    }

                    const useOptionalAccess = node.optional;

                    context.report({
                        fix(fixer) {
                            const atCallText = getAtCallText(
                                sourceCode,
                                node,
                                indexText,
                                useOptionalAccess,
                            );

                            return atCallText === null
                                ? null
                                : fixer.replaceText(
                                      node,
                                      appendAtFallback(
                                          node,
                                          atCallText,
                                          indexedAccessTypeAlreadyIncludesUndefined,
                                      ),
                                  );
                        },
                        messageId: 'atCompatPreferAt',
                        node: node.property,
                    });

                    return;
                }

                if (getMemberExpressionPropertyName(node) !== 'at') {
                    return;
                }

                const tsObjectNode = esTreeNodeToTSNodeMap.get(node.object);
                const objectType = typeChecker.getTypeAtLocation(tsObjectNode);

                if (!hasBuiltInAtReceiverType(typeChecker, objectType)) {
                    return;
                }

                context.report({
                    fix(fixer) {
                        const call = getAtCall(node);

                        if (!call) {
                            return null;
                        }

                        const index = getAtIndex(sourceCode, call);

                        if (index === null) {
                            return null;
                        }

                        if (index.type === 'last') {
                            return getLastIndexFix(fixer, sourceCode, node, call);
                        }

                        const access = node.optional ? '?.' : '';
                        const accessStart = getMemberAccessStart(sourceCode, node);

                        return accessStart === null
                            ? null
                            : fixer.replaceTextRange(
                                  [accessStart, call.range[1]],
                                  `${access}[${index.text}]`,
                              );
                    },
                    messageId: 'atCompatAvoidAt',
                    node: node.property,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Keep built-in .at() and indexed access aligned with the TypeScript target',
        },
        fixable: 'code',
        messages: {
            atCompatAvoidAt:
                'Avoid built-in .at() because the TypeScript target is below ES2022.',
            atCompatPreferAt:
                'Prefer built-in .at() because the TypeScript target supports ES2022.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'at-compat',
});

export default rule;
