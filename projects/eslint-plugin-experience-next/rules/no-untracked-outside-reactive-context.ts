import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import {type SourceCode} from '@typescript-eslint/utils/ts-eslint';
import type ts from 'typescript';

import {
    findEnclosingReactiveScope,
    findEnclosingReactiveScopeAfterAsyncBoundary,
    getLocalNameForImport,
    getReactiveScopes,
    isAngularUntrackedCall,
    type NodeMap,
    walkAst,
} from './utils/angular-signals';
import {buildImportRemovalFixes, findUntrackedAlias} from './utils/import-fix-helpers';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from './utils/untracked-docs';

type MessageId = 'outsideReactiveContext';

type ClassMember = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

type FunctionLikeNode =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression;
const IMPERATIVE_UNTRACKED_METHODS = new Set(['registerOnChange', 'writeValue']);

function dedent(text: string, extraSpaces: number): string {
    if (extraSpaces <= 0) {
        return text;
    }

    const prefix = ' '.repeat(extraSpaces);

    return text
        .split('\n')
        .map((line) => (line.startsWith(prefix) ? line.slice(extraSpaces) : line))
        .join('\n');
}

function isFunctionLike(node: TSESTree.Node): node is FunctionLikeNode {
    return (
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression
    );
}

function getObjectPropertyName(node: TSESTree.Property): string | null {
    if (node.computed) {
        return null;
    }

    if (node.key.type === AST_NODE_TYPES.Identifier) {
        return node.key.name;
    }

    return typeof node.key.value === 'string' ? node.key.value : null;
}

function getMemberExpressionPropertyName(node: TSESTree.MemberExpression): string | null {
    if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
        return node.property.name;
    }

    return node.property.type === AST_NODE_TYPES.Literal &&
        typeof node.property.value === 'string'
        ? node.property.value
        : null;
}

function getEnclosingClassMember(node: TSESTree.Node): ClassMember | null {
    for (let current = node.parent; current; current = current.parent) {
        if (
            current.type === AST_NODE_TYPES.MethodDefinition ||
            current.type === AST_NODE_TYPES.PropertyDefinition
        ) {
            return current;
        }
    }

    return null;
}

function getEnclosingFunction(node: TSESTree.Node): FunctionLikeNode | null {
    for (let current = node.parent; current; current = current.parent) {
        if (isFunctionLike(current)) {
            return current;
        }
    }

    return null;
}

function getClassMemberName(member: ClassMember): string | null {
    if (member.key.type === AST_NODE_TYPES.Identifier) {
        return member.key.name;
    }

    if (
        member.key.type === AST_NODE_TYPES.Literal &&
        typeof member.key.value === 'string'
    ) {
        return member.key.value;
    }

    return null;
}

function hasNamedDecorator(
    node: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
    name: string,
): boolean {
    return node.decorators.some((decorator) => {
        const expression = decorator.expression;

        if (expression.type === AST_NODE_TYPES.Identifier) {
            return expression.name === name;
        }

        return (
            expression.type === AST_NODE_TYPES.CallExpression &&
            expression.callee.type === AST_NODE_TYPES.Identifier &&
            expression.callee.name === name
        );
    });
}

function isPipeTransformMember(member: ClassMember): boolean {
    if (getClassMemberName(member) !== 'transform') {
        return false;
    }

    return hasNamedDecorator(member.parent.parent, 'Pipe');
}

function hasAllowedImperativeAssignment(node: TSESTree.Node): boolean {
    for (let current = node.parent; current; current = current.parent) {
        if (!isFunctionLike(current)) {
            continue;
        }

        const parent = current.parent;

        if (
            parent.type === AST_NODE_TYPES.AssignmentExpression &&
            parent.right === current &&
            parent.left.type === AST_NODE_TYPES.MemberExpression
        ) {
            const memberName = getMemberExpressionPropertyName(parent.left);

            if (memberName && IMPERATIVE_UNTRACKED_METHODS.has(memberName)) {
                return true;
            }
        }
    }

    return false;
}

function isAllowedImperativeAngularContext(node: TSESTree.Node): boolean {
    const member = getEnclosingClassMember(node);
    const memberName = member ? getClassMemberName(member) : null;

    return (
        (!!member &&
            !!memberName &&
            (IMPERATIVE_UNTRACKED_METHODS.has(memberName) ||
                isPipeTransformMember(member))) ||
        hasAllowedImperativeAssignment(node)
    );
}

function isDirectCallbackArgument(fn: FunctionLikeNode): boolean {
    const parent = fn.parent;

    if (
        fn.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
        fn.type !== AST_NODE_TYPES.FunctionExpression
    ) {
        return false;
    }

    return (
        (parent.type === AST_NODE_TYPES.CallExpression ||
            parent.type === AST_NODE_TYPES.NewExpression) &&
        parent.arguments.includes(fn)
    );
}

function getScopeRoot(node: TSESTree.Node): TSESTree.Node {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type === AST_NODE_TYPES.Program || isFunctionLike(current)) {
            return current;
        }
    }

    return node;
}

function isStoredCallbackUsedAsArgument(
    fn: FunctionLikeNode,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    const parent = fn.parent;

    if (
        parent.type !== AST_NODE_TYPES.VariableDeclarator ||
        parent.id.type !== AST_NODE_TYPES.Identifier
    ) {
        return false;
    }

    const id = parent.id;

    const tsNode = esTreeNodeToTSNodeMap.get(id);

    if (!tsNode) {
        return false;
    }

    const symbol = checker.getSymbolAtLocation(tsNode);

    if (!symbol) {
        return false;
    }

    let found = false;
    const scopeRoot = getScopeRoot(parent);

    walkAst(scopeRoot, (node) => {
        if (
            node.type !== AST_NODE_TYPES.Identifier ||
            node === id ||
            node.name !== id.name
        ) {
            return;
        }

        const referenceTsNode = esTreeNodeToTSNodeMap.get(node);
        const referenceSymbol = referenceTsNode
            ? checker.getSymbolAtLocation(referenceTsNode)
            : null;

        if (referenceSymbol !== symbol) {
            return;
        }

        const usageParent = node.parent;

        if (
            (usageParent.type === AST_NODE_TYPES.CallExpression ||
                usageParent.type === AST_NODE_TYPES.NewExpression) &&
            usageParent.arguments.includes(node)
        ) {
            found = true;

            return false;
        }

        return;
    });

    return found;
}

function isAllowedDeferredCallbackContext(
    node: TSESTree.CallExpression,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    const [arg] = node.arguments;

    if (
        !arg ||
        arg.type === AST_NODE_TYPES.SpreadElement ||
        (arg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            arg.type !== AST_NODE_TYPES.FunctionExpression)
    ) {
        return false;
    }

    const fn = getEnclosingFunction(node);

    if (!fn) {
        return false;
    }

    return (
        isDirectCallbackArgument(fn) ||
        isStoredCallbackUsedAsArgument(fn, checker, esTreeNodeToTSNodeMap)
    );
}

function isAngularInjectionTokenFactoryFunction(
    fn: FunctionLikeNode,
    program: TSESTree.Program,
): boolean {
    const parent = fn.parent;
    const injectionTokenName = getLocalNameForImport(
        program,
        '@angular/core',
        'InjectionToken',
    );

    if (
        !injectionTokenName ||
        parent.type !== AST_NODE_TYPES.Property ||
        getObjectPropertyName(parent) !== 'factory'
    ) {
        return false;
    }

    const objectExpression = parent.parent;

    return (
        objectExpression.type === AST_NODE_TYPES.ObjectExpression &&
        objectExpression.parent.type === AST_NODE_TYPES.NewExpression &&
        objectExpression.parent.arguments.includes(objectExpression) &&
        objectExpression.parent.callee.type === AST_NODE_TYPES.Identifier &&
        objectExpression.parent.callee.name === injectionTokenName
    );
}

function isAngularUseFactoryFunction(fn: FunctionLikeNode): boolean {
    const parent = fn.parent;

    if (
        parent.type !== AST_NODE_TYPES.Property ||
        getObjectPropertyName(parent) !== 'useFactory'
    ) {
        return false;
    }

    const objectExpression = parent.parent;

    return (
        objectExpression.type === AST_NODE_TYPES.ObjectExpression &&
        objectExpression.properties.some(
            (property) =>
                property.type === AST_NODE_TYPES.Property &&
                getObjectPropertyName(property) === 'provide',
        )
    );
}

function isReactiveOwnerCall(
    node: TSESTree.Node,
    program: TSESTree.Program,
): node is TSESTree.CallExpression {
    return (
        node.type === AST_NODE_TYPES.CallExpression &&
        getReactiveScopes(node, program).length > 0
    );
}

function getFixableReactiveCall(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): TSESTree.CallExpression | null {
    const [arg] = node.arguments;

    if (
        !arg ||
        arg.type === AST_NODE_TYPES.SpreadElement ||
        (arg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            arg.type !== AST_NODE_TYPES.FunctionExpression)
    ) {
        return null;
    }

    if (isReactiveOwnerCall(arg.body, program)) {
        return arg.body;
    }

    if (arg.body.type !== AST_NODE_TYPES.BlockStatement || arg.body.body.length !== 1) {
        return null;
    }

    const [statement] = arg.body.body;

    if (
        statement?.type === AST_NODE_TYPES.ReturnStatement &&
        statement.argument &&
        isReactiveOwnerCall(statement.argument, program)
    ) {
        return statement.argument;
    }

    if (
        node.parent.type === AST_NODE_TYPES.ExpressionStatement &&
        statement?.type === AST_NODE_TYPES.ExpressionStatement &&
        isReactiveOwnerCall(statement.expression, program)
    ) {
        return statement.expression;
    }

    return null;
}

function isAllowedLazyAngularFactoryContext(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): boolean {
    const fn = getEnclosingFunction(node);

    if (!fn || !getFixableReactiveCall(node, program)) {
        return false;
    }

    return (
        isAngularInjectionTokenFactoryFunction(fn, program) ||
        isAngularUseFactoryFunction(fn)
    );
}

function buildReactiveCallReplacement(
    outerUntrackedCall: TSESTree.CallExpression,
    reactiveCall: TSESTree.CallExpression,
    sourceCode: SourceCode,
): string {
    const text = sourceCode.getText(reactiveCall);

    if (
        reactiveCall.parent.type !== AST_NODE_TYPES.ExpressionStatement ||
        outerUntrackedCall.parent.type !== AST_NODE_TYPES.ExpressionStatement
    ) {
        return text;
    }

    return dedent(
        text,
        reactiveCall.loc.start.column - outerUntrackedCall.parent.loc.start.column,
    );
}

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const esTreeNodeToTSNodeMap =
            parserServices.esTreeNodeToTSNodeMap as unknown as NodeMap;
        const {sourceCode} = context;
        const program = sourceCode.ast as TSESTree.Program;
        const getUntrackedLocalName = (): string | null => findUntrackedAlias(program);

        function isUntrackedUsedElsewhere(
            localName: string,
            excludeNode: TSESTree.CallExpression,
        ): boolean {
            let found = false;

            walkAst(program, (node) => {
                if (
                    node.type === AST_NODE_TYPES.CallExpression &&
                    node !== excludeNode &&
                    node.callee.type === AST_NODE_TYPES.Identifier &&
                    node.callee.name === localName
                ) {
                    found = true;

                    return false;
                }

                return;
            });

            return found;
        }

        return {
            CallExpression(node: TSESTree.CallExpression) {
                if (
                    !isAngularUntrackedCall(node, program) ||
                    findEnclosingReactiveScope(node, program) ||
                    findEnclosingReactiveScopeAfterAsyncBoundary(node, program) ||
                    isAllowedImperativeAngularContext(node) ||
                    isAllowedDeferredCallbackContext(
                        node,
                        checker,
                        esTreeNodeToTSNodeMap,
                    ) ||
                    isAllowedLazyAngularFactoryContext(node, program)
                ) {
                    return;
                }

                const reactiveCall = getFixableReactiveCall(node, program);

                context.report({
                    fix: reactiveCall
                        ? (fixer) => {
                              const fixes = [
                                  fixer.replaceText(
                                      node,
                                      buildReactiveCallReplacement(
                                          node,
                                          reactiveCall,
                                          sourceCode,
                                      ),
                                  ),
                              ];
                              const untrackedLocalName = getUntrackedLocalName();
                              const stillUsed =
                                  untrackedLocalName !== null &&
                                  isUntrackedUsedElsewhere(untrackedLocalName, node);

                              if (!stillUsed) {
                                  fixes.push(
                                      ...buildImportRemovalFixes(
                                          program,
                                          fixer,
                                          sourceCode,
                                      ),
                                  );
                              }

                              return fixes;
                          }
                        : undefined,
                    messageId: 'outsideReactiveContext',
                    node:
                        node.callee.type === AST_NODE_TYPES.Identifier
                            ? node.callee
                            : node,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow `untracked()` outside reactive callbacks, except for synchronous reactive reads, explicit post-`await` snapshot reads, and supported imperative/deferred/lazy-factory Angular escape hatches',
            url: ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
        },
        fixable: 'code',
        messages: {
            outsideReactiveContext:
                '`untracked()` is used outside a reactive callback and outside the supported post-`await` / imperative / deferred / lazy-factory exceptions, so it does not prevent dependency tracking and only adds noise. Remove it. See Angular guide: https://angular.dev/guide/signals#reading-without-tracking-dependencies',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-untracked-outside-reactive-context',
});

export default rule;
