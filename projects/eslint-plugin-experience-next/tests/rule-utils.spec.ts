import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getReactiveCallbackArgument} from '../rules/utils/angular/angular-signals';
import {isPipeTransformMember} from '../rules/utils/angular/pipes';
import {
    isAngularInjectionTokenFactoryFunction,
    isAngularUseFactoryFunction,
} from '../rules/utils/angular/providers';
import {
    getEnclosingClass,
    getEnclosingClassMember,
    getEnclosingFunction,
    isNodeInside,
} from '../rules/utils/ast/ancestors';
import {collectCallExpressions} from '../rules/utils/ast/call-expressions';
import {
    getLeadingIndentation,
    getLineBreak,
    hasBlankLine,
    hasCommentLikeText,
    isAccessorMember,
    isFieldLikeMember,
    isRelevantSpacingClassMember,
    isSingleLineNode,
} from '../rules/utils/ast/class-members';
import {collectMutationTargets} from '../rules/utils/ast/mutation-targets';
import {
    getParenthesizedInner,
    unwrapParenthesized,
} from '../rules/utils/ast/parenthesized';
import {
    getClassMemberName,
    getMemberExpressionPropertyName,
    getObjectPropertyName,
    getStaticPropertyName,
} from '../rules/utils/ast/property-names';
import {getReturnedExpression} from '../rules/utils/ast/returned-expression';
import {
    getStaticStringValue,
    isEmptyStaticString,
    isStaticString,
    isStringLiteral,
} from '../rules/utils/ast/string-literals';
import {dedent} from '../rules/utils/text/dedent';
import {hasNamedDecorator} from '../rules/utils/typescript/decorators';

function attachParents(node: TSESTree.Node, parent?: TSESTree.Node): void {
    if (parent) {
        (node as TSESTree.Node & {parent: TSESTree.Node}).parent = parent;
    }

    for (const [key, value] of Object.entries(node)) {
        if (key === 'parent') {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                if (item && typeof item === 'object' && 'type' in item) {
                    attachParents(item as TSESTree.Node, node);
                }
            }

            continue;
        }

        if (value && typeof value === 'object' && 'type' in value) {
            attachParents(value as TSESTree.Node, node);
        }
    }
}

function parseProgram(code: string): TSESTree.Program {
    const {parseForESLint} = require('@typescript-eslint/parser');

    const ast = parseForESLint(code, {
        ecmaVersion: 'latest',
        experimentalDecorators: true,
        loc: true,
        range: true,
        sourceType: 'module',
    }).ast as unknown as TSESTree.Program;

    attachParents(ast);

    return ast;
}

function getFirstExpression(code: string): TSESTree.Expression {
    const [statement] = parseProgram(code).body;

    if (statement?.type !== AST_NODE_TYPES.ExpressionStatement) {
        throw new Error('Expected the first statement to be an expression statement');
    }

    return statement.expression;
}

function getFirstClassDeclaration(code: string): TSESTree.ClassDeclaration {
    const [statement] = parseProgram(code).body;

    if (statement?.type !== AST_NODE_TYPES.ClassDeclaration) {
        throw new Error('Expected the first statement to be a class declaration');
    }

    return statement;
}

describe('rule utils', () => {
    it('dents replacement text without touching shorter lines', () => {
        expect(dedent('        foo();\n        bar();\n    baz();', 8)).toBe(
            'foo();\nbar();\n    baz();',
        );
    });

    it('recognizes static string literals and templates', () => {
        const literal = getFirstExpression("'taiga'");
        const template = getFirstExpression('`ui`');
        const dynamicTemplate = getFirstExpression('`${value}`');

        expect(isStringLiteral(literal)).toBe(true);
        expect(isStaticString(literal)).toBe(true);
        expect(getStaticStringValue(literal)).toBe('taiga');

        expect(isStaticString(template)).toBe(true);
        expect(getStaticStringValue(template)).toBe('ui');

        expect(isStaticString(dynamicTemplate)).toBe(false);
        expect(getStaticStringValue(dynamicTemplate)).toBeNull();
    });

    it('detects empty static strings', () => {
        expect(isEmptyStaticString(getFirstExpression("''"))).toBe(true);
        expect(isEmptyStaticString(getFirstExpression('``'))).toBe(true);
        expect(isEmptyStaticString(getFirstExpression('`filled`'))).toBe(false);
    });

    it('extracts static property and member names', () => {
        const objectDeclaration = parseProgram(
            "const obj = {factory: 1, ['host']: 2, value: 3};",
        ).body[0];

        if (objectDeclaration?.type !== AST_NODE_TYPES.VariableDeclaration) {
            throw new Error('Expected a variable declaration');
        }

        const objectExpression = objectDeclaration.declarations[0].init;

        if (objectExpression?.type !== AST_NODE_TYPES.ObjectExpression) {
            throw new Error('Expected an object expression');
        }

        const [factoryProperty, computedHostProperty] = objectExpression.properties;

        if (
            factoryProperty?.type !== AST_NODE_TYPES.Property ||
            computedHostProperty?.type !== AST_NODE_TYPES.Property
        ) {
            throw new Error('Expected object properties');
        }

        const computedMember = getFirstExpression("control['writeValue']");
        const dynamicMember = getFirstExpression('control[methodName]');
        const classDeclaration = parseProgram(
            "class Test { transform() {} ['writeValue']() {} #hidden = 0; }",
        ).body[0];

        if (classDeclaration?.type !== AST_NODE_TYPES.ClassDeclaration) {
            throw new Error('Expected a class declaration');
        }

        const [transformMethod, writeValueMethod, privateField] =
            classDeclaration.body.body;

        if (
            transformMethod?.type !== AST_NODE_TYPES.MethodDefinition ||
            writeValueMethod?.type !== AST_NODE_TYPES.MethodDefinition ||
            privateField?.type !== AST_NODE_TYPES.PropertyDefinition ||
            computedMember.type !== AST_NODE_TYPES.MemberExpression ||
            dynamicMember.type !== AST_NODE_TYPES.MemberExpression
        ) {
            throw new Error('Expected members with static names');
        }

        expect(getStaticPropertyName(factoryProperty.key)).toBe('factory');
        expect(getStaticPropertyName(writeValueMethod.key)).toBe('writeValue');
        expect(getObjectPropertyName(factoryProperty)).toBe('factory');
        expect(getObjectPropertyName(computedHostProperty)).toBeNull();
        expect(getMemberExpressionPropertyName(computedMember)).toBe('writeValue');
        expect(getMemberExpressionPropertyName(dynamicMember)).toBeNull();
        expect(getClassMemberName(transformMethod)).toBe('transform');
        expect(getClassMemberName(writeValueMethod)).toBe('writeValue');
        expect(getClassMemberName(privateField)).toBeNull();
    });

    it('extracts reactive callbacks from call expressions only when present', () => {
        const callWithCallback = getFirstExpression('untracked(() => count())');
        const callWithGetter = getFirstExpression('untracked(count)');

        if (
            callWithCallback.type !== AST_NODE_TYPES.CallExpression ||
            callWithGetter.type !== AST_NODE_TYPES.CallExpression
        ) {
            throw new Error('Expected call expressions');
        }

        const callback = getReactiveCallbackArgument(callWithCallback);

        expect(callback?.type).toBe(AST_NODE_TYPES.ArrowFunctionExpression);
        expect(getReactiveCallbackArgument(callWithGetter)).toBeNull();
    });

    it('finds enclosing AST ancestors for reusable function and class lookups', () => {
        const classDeclaration = getFirstClassDeclaration(`
            @Pipe({name: 'example'})
            class Example {
                transform() {
                    const callback = () => value;
                    return callback();
                }
            }
        `);
        const [transformMethod] = classDeclaration.body.body;

        if (transformMethod?.type !== AST_NODE_TYPES.MethodDefinition) {
            throw new Error('Expected a method definition');
        }

        const [callbackDeclaration] = transformMethod.value.body?.body ?? [];

        if (callbackDeclaration?.type !== AST_NODE_TYPES.VariableDeclaration) {
            throw new Error('Expected a variable declaration');
        }

        const callback = callbackDeclaration.declarations[0].init;

        if (callback?.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
            throw new Error('Expected an arrow function');
        }

        const identifier = callback.body;

        if (identifier.type !== AST_NODE_TYPES.Identifier) {
            throw new Error('Expected an identifier body');
        }

        expect(getEnclosingFunction(identifier)).toBe(callback);
        expect(getEnclosingClassMember(identifier)).toBe(transformMethod);
        expect(getEnclosingClass(transformMethod)).toBe(classDeclaration);
        expect(isNodeInside(identifier, transformMethod)).toBe(true);
        expect(hasNamedDecorator(classDeclaration, 'Pipe')).toBe(true);
        expect(isPipeTransformMember(transformMethod)).toBe(true);
    });

    it('unwraps parenthesized expressions and extracts returned expressions', () => {
        const identifier = getFirstExpression('value');
        const arrow = getFirstExpression('() => ((value))');
        const parenthesized = {
            expression: {
                expression: identifier,
                type: 'ParenthesizedExpression',
            },
            type: 'ParenthesizedExpression',
        } as unknown as TSESTree.Node;

        if (arrow.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
            throw new Error('Expected an arrow function');
        }

        const inner = getParenthesizedInner(parenthesized);
        const returned = getReturnedExpression(arrow);

        expect(inner?.type).toBe('ParenthesizedExpression');
        expect(unwrapParenthesized(parenthesized)).toMatchObject({
            name: 'value',
            type: AST_NODE_TYPES.Identifier,
        });

        if (!returned) {
            throw new Error('Expected a returned expression');
        }

        expect(unwrapParenthesized(returned)).toMatchObject({
            name: 'value',
            type: AST_NODE_TYPES.Identifier,
        });
    });

    it('recognizes field-like and accessor class members for spacing utilities', () => {
        const classDeclaration = parseProgram(`
            abstract class Test {
                protected readonly field = 1;
                abstract title: string;
                get value() { return this.field; }
                set value(next: number) { this.field = next; }
            }
        `).body[0];

        if (classDeclaration?.type !== AST_NODE_TYPES.ClassDeclaration) {
            throw new Error('Expected a class declaration');
        }

        const [field, abstractField, getter, setter] = classDeclaration.body.body;

        if (!field || !abstractField || !getter || !setter) {
            throw new Error('Expected class members');
        }

        expect(isFieldLikeMember(field)).toBe(true);
        expect(isFieldLikeMember(abstractField)).toBe(true);
        expect(isAccessorMember(getter)).toBe(true);
        expect(isAccessorMember(setter)).toBe(true);
        expect(isRelevantSpacingClassMember(getter)).toBe(true);
        expect(isSingleLineNode(field)).toBe(true);
    });

    it('handles line-break and spacing helpers for class-member text gaps', () => {
        expect(hasCommentLikeText(' /* note */ ')).toBe(true);
        expect(hasCommentLikeText('\n    // note')).toBe(true);
        expect(hasCommentLikeText('\n    next')).toBe(false);
        expect(hasBlankLine('\n\n    next')).toBe(true);
        expect(hasBlankLine('\r\n\r\n    next')).toBe(true);
        expect(hasBlankLine('\n    next')).toBe(false);
        expect(getLineBreak('\r\n    next')).toBe('\r\n');
        expect(getLineBreak('\r    next')).toBe('\r');
        expect(getLineBreak('\n    next')).toBe('\n');
        expect(getLeadingIndentation('    value')).toBe('    ');
        expect(getLeadingIndentation('\t\tvalue')).toBe('\t\t');
        expect(getLeadingIndentation('value')).toBe('');
    });

    it('collects calls and mutation targets from generic AST helpers', () => {
        const callExpression = getFirstExpression('foo(bar(), baz(qux()))');
        const assignment = getFirstExpression('([first, state.value] = source)');

        if (assignment.type !== AST_NODE_TYPES.AssignmentExpression) {
            throw new Error('Expected an assignment expression');
        }

        const calls = collectCallExpressions(callExpression);
        const targets = collectMutationTargets(assignment.left);

        expect(calls).toHaveLength(4);
        expect(targets).toHaveLength(2);
        expect(targets[0]).toMatchObject({
            name: 'first',
            type: AST_NODE_TYPES.Identifier,
        });
        expect(targets[1]?.type).toBe(AST_NODE_TYPES.MemberExpression);
    });

    it('recognizes Angular provider factory callbacks in reusable utilities', () => {
        const program = parseProgram(`
            import {InjectionToken} from '@angular/core';

            const TOKEN = new InjectionToken('token', {factory: () => 1});
            const provider = {provide: TOKEN, useFactory: function () { return 2; }};
        `);
        const tokenDeclaration = program.body[1];
        const providerDeclaration = program.body[2];

        if (
            tokenDeclaration?.type !== AST_NODE_TYPES.VariableDeclaration ||
            providerDeclaration?.type !== AST_NODE_TYPES.VariableDeclaration
        ) {
            throw new Error('Expected variable declarations');
        }

        const tokenInitializer = tokenDeclaration.declarations[0].init;
        const providerInitializer = providerDeclaration.declarations[0].init;

        if (
            tokenInitializer?.type !== AST_NODE_TYPES.NewExpression ||
            providerInitializer?.type !== AST_NODE_TYPES.ObjectExpression
        ) {
            throw new Error('Expected provider initializers');
        }

        const tokenOptions = tokenInitializer.arguments[1];
        const useFactoryProperty = providerInitializer.properties[1];

        if (
            tokenOptions?.type !== AST_NODE_TYPES.ObjectExpression ||
            tokenOptions.properties[0]?.type !== AST_NODE_TYPES.Property ||
            useFactoryProperty?.type !== AST_NODE_TYPES.Property
        ) {
            throw new Error('Expected provider properties');
        }

        expect(
            isAngularInjectionTokenFactoryFunction(
                tokenOptions.properties[0].value as TSESTree.FunctionLike,
                program,
            ),
        ).toBe(true);
        expect(
            isAngularUseFactoryFunction(
                useFactoryProperty.value as TSESTree.FunctionLike,
            ),
        ).toBe(true);
    });
});
