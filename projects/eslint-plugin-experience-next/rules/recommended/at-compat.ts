import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import {
    type InterfaceType,
    ScriptTarget,
    type Type,
    type TypeChecker,
    TypeFlags,
} from 'typescript';

import {walkAst} from '../utils/ast/ast-walk';
import {getParenthesizedInner} from '../utils/ast/parenthesized';
import {
    getMemberExpressionPropertyName,
    getStaticPropertyName,
} from '../utils/ast/property-names';
import {getLineBreak} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';
import {hasVariableInScope} from '../utils/eslint/scope';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

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

const BUILT_IN_AT_RECEIVER_NAMES = new Set([
    'Array',
    'BigInt64Array',
    'BigUint64Array',
    'Float32Array',
    'Float64Array',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'ReadonlyArray',
    'String',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
]);

const SUPPORTED_STATEMENT_TYPES = new Set<AST_NODE_TYPES>([
    AST_NODE_TYPES.ExpressionStatement,
    AST_NODE_TYPES.ReturnStatement,
    AST_NODE_TYPES.ThrowStatement,
    AST_NODE_TYPES.VariableDeclaration,
]);

const NULLISH_TYPE_FLAGS = TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void;
const FALLBACK_SCRIPT_TARGET = ScriptTarget.ES2021;

function supportsAt(target: ScriptTarget): boolean {
    return target >= ScriptTarget.ES2022;
}

function isInterfaceType(type: Type): type is InterfaceType {
    return 'getBaseTypes' in type && typeof type.getBaseTypes === 'function';
}

function isNullishType(type: Type): boolean {
    return (type.flags & NULLISH_TYPE_FLAGS) !== 0;
}

function hasKnownBuiltInAtReceiver(
    typeChecker: TypeChecker,
    type: Type,
    visitedTypes = new Set<Type>(),
): boolean {
    const hasNoReliableType = (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0;
    const shouldSkipReceiverType = hasNoReliableType || visitedTypes.has(type);

    if (shouldSkipReceiverType) {
        return false;
    }

    visitedTypes.add(type);

    if (type.isUnion()) {
        const definedTypes = type.types.filter((item) => !isNullishType(item));

        return (
            definedTypes.length > 0 &&
            definedTypes.every((item) =>
                hasKnownBuiltInAtReceiver(typeChecker, item, visitedTypes),
            )
        );
    }

    if (type.isIntersection()) {
        return type.types.some((item) =>
            hasKnownBuiltInAtReceiver(typeChecker, item, visitedTypes),
        );
    }

    const apparentType = typeChecker.getApparentType(type);

    if (typeChecker.isArrayType(apparentType) || typeChecker.isTupleType(apparentType)) {
        return true;
    }

    const symbolName = apparentType.getSymbol()?.getName();

    const hasBuiltInAtReceiverSymbol =
        symbolName !== undefined && BUILT_IN_AT_RECEIVER_NAMES.has(symbolName);

    if (hasBuiltInAtReceiverSymbol) {
        return true;
    }

    return isInterfaceType(apparentType)
        ? (apparentType.getBaseTypes() ?? []).some((baseType) =>
              hasKnownBuiltInAtReceiver(typeChecker, baseType, visitedTypes),
          )
        : false;
}

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

function getSafeBracketIndexText(
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

function getNodeParent(node: TSESTree.Node): TSESTree.Node | null {
    const nodeWithParent = node as {readonly parent?: TSESTree.Node};

    return nodeWithParent.parent ?? null;
}

function getReplacementExpression(node: TSESTree.MemberExpression): TSESTree.Node {
    const parent = getNodeParent(node);

    return parent?.type === AST_NODE_TYPES.ChainExpression ? parent : node;
}

function isLogicalFallbackOperand(node: TSESTree.MemberExpression): boolean {
    const expression = getReplacementExpression(node);
    const parent = getNodeParent(expression);

    return (
        parent?.type === AST_NODE_TYPES.LogicalExpression &&
        (parent.operator === '??' || parent.operator === '||') &&
        parent.left === expression
    );
}

function isConditionExpression(node: TSESTree.MemberExpression): boolean {
    let current = getReplacementExpression(node);
    let parent = getNodeParent(current);

    if (!parent) {
        return false;
    }

    while (parent?.type === AST_NODE_TYPES.LogicalExpression) {
        current = parent;
        parent = getNodeParent(parent);
    }

    if (!parent) {
        return false;
    }

    if (parent.type === AST_NODE_TYPES.UnaryExpression && parent.operator === '!') {
        current = parent;
        parent = getNodeParent(parent);
    }

    return parent
        ? (parent.type === AST_NODE_TYPES.IfStatement && parent.test === current) ||
              (parent.type === AST_NODE_TYPES.ConditionalExpression &&
                  parent.test === current) ||
              (parent.type === AST_NODE_TYPES.WhileStatement &&
                  parent.test === current) ||
              (parent.type === AST_NODE_TYPES.DoWhileStatement &&
                  parent.test === current) ||
              (parent.type === AST_NODE_TYPES.ForStatement && parent.test === current)
        : false;
}

function appendAtFallback(node: TSESTree.MemberExpression, atCallText: string): string {
    const canUseSurroundingFallback =
        isLogicalFallbackOperand(node) || isConditionExpression(node);

    return node.optional || canUseSurroundingFallback || hasNonNullAssertionParent(node)
        ? atCallText
        : `${atCallText}!`;
}

function hasNonNullAssertionParent(node: TSESTree.Node): boolean {
    let current = node;
    let parent = getNodeParent(current);

    while (parent) {
        if (
            parent.type === AST_NODE_TYPES.TSNonNullExpression &&
            parent.expression === current
        ) {
            return true;
        }

        if (getParenthesizedInner(parent) !== current) {
            return false;
        }

        current = parent;
        parent = getNodeParent(current);
    }

    return false;
}

function isAssignmentTarget(node: TSESTree.MemberExpression): boolean {
    const {parent} = node;

    return (
        (parent.type === AST_NODE_TYPES.AssignmentExpression && parent.left === node) ||
        (parent.type === AST_NODE_TYPES.UpdateExpression && parent.argument === node) ||
        (parent.type === AST_NODE_TYPES.UnaryExpression &&
            parent.operator === 'delete' &&
            parent.argument === node) ||
        (parent.type === AST_NODE_TYPES.ForInStatement && parent.left === node) ||
        (parent.type === AST_NODE_TYPES.ForOfStatement && parent.left === node)
    );
}

function getMemberAccessStart(
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

function getLineIndent(text: string, start: number): string {
    const lineStart = getLineStart(text, start);
    const linePrefix = text.slice(lineStart, start);
    const indent = /^\s*/.exec(linePrefix);

    return indent?.[0] ?? '';
}

function getLineStart(text: string, start: number): number {
    return text.lastIndexOf('\n', start - 1) + 1;
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
        if (isFunctionExpressionBoundary(current)) {
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
        if (node !== root && isFunctionExpressionBoundary(node)) {
            return false;
        }

        if (isNonRepeatableLastAtCall(sourceCode, node)) {
            count++;
        }

        return;
    });

    return count > 1;
}

function isFunctionExpressionBoundary(node: TSESTree.Node): boolean {
    return (
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.FunctionExpression
    );
}

function getClassPropertyWithoutFunctionBoundary(
    node: TSESTree.Node,
): TSESTree.PropertyDefinition | null {
    let current = node.parent;

    while (current) {
        if (current.type === AST_NODE_TYPES.PropertyDefinition) {
            return current;
        }

        if (isFunctionExpressionBoundary(current)) {
            return null;
        }

        current = current.parent;
    }

    return null;
}

function getClassPropertyPrefix(property: TSESTree.PropertyDefinition): string {
    const modifiers = ['private', property.static ? 'static' : null, 'readonly'].filter(
        (modifier): modifier is string => Boolean(modifier),
    );

    return `${modifiers.join(' ')} `;
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

        const indent = getLineIndent(sourceCode.text, statement.range[0]);
        const lineStart = getLineStart(sourceCode.text, statement.range[0]);
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

        const receiverText = `this.${propertyName}`;
        const indent = getLineIndent(sourceCode.text, property.range[0]);
        const lineStart = getLineStart(sourceCode.text, property.range[0]);
        const lineBreak = getLineBreak(sourceCode.text);

        return [
            fixer.insertTextBeforeRange(
                [lineStart, lineStart],
                `${indent}${getClassPropertyPrefix(property)}${propertyName} = ${objectText};${lineBreak}${lineBreak}`,
            ),
            fixer.replaceText(call, `${receiverText}[${receiverText}.length - 1]`),
        ];
    }

    return null;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const typeAwareContext = getTypeAwareRuleContext(context);

        const scriptTarget =
            typeAwareContext.tsProgram.getCompilerOptions().target ??
            FALLBACK_SCRIPT_TARGET;

        const canUseAt = supportsAt(scriptTarget);
        const {checker: typeChecker, esTreeNodeToTSNodeMap} = typeAwareContext;
        const {sourceCode} = context;

        return {
            MemberExpression(node: TSESTree.MemberExpression) {
                if (canUseAt) {
                    const indexText = getSafeBracketIndexText(sourceCode, node);

                    if (indexText === null || isAssignmentTarget(node)) {
                        return;
                    }

                    const tsObjectNode = esTreeNodeToTSNodeMap.get(node.object);
                    const objectType = typeChecker.getTypeAtLocation(tsObjectNode);

                    if (!hasKnownBuiltInAtReceiver(typeChecker, objectType)) {
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
                                      appendAtFallback(node, atCallText),
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

                if (!hasKnownBuiltInAtReceiver(typeChecker, objectType)) {
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
