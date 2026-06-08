import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import {ScriptTarget} from 'typescript';

import {getReactiveCallbackArgument} from '../rules/utils/angular/angular-signals';
import {
    getStaticAttribute,
    getStaticAttributeValue,
    hasAttributeBinding,
    hasElementAttribute,
    hasInputBinding,
    hasOutputBinding,
} from '../rules/utils/angular/element-attributes';
import {isInteractiveElement} from '../rules/utils/angular/interactive-elements';
import {isPipeTransformMember} from '../rules/utils/angular/pipes';
import {
    isAngularInjectionTokenFactoryFunction,
    isAngularUseFactoryFunction,
} from '../rules/utils/angular/providers';
import {
    containsAbsoluteSourceSpan,
    getAbsoluteSourceSpanText,
} from '../rules/utils/angular/source-span';
import {
    getBoundAttributes,
    getContainingBoundAttribute,
    type TemplateAttributeContainer,
} from '../rules/utils/angular/template-attributes';
import {
    isAstWithSource,
    isConditional,
    unwrapAstWithSource,
} from '../rules/utils/angular/template-expressions';
import {
    collectTemplateIdentifiers,
    getTemplateNodes,
} from '../rules/utils/angular/template-identifiers';
import {
    getEnclosingClass,
    getEnclosingClassMember,
    getEnclosingFunction,
    getParentNode,
    isNodeInside,
} from '../rules/utils/ast/ancestors';
import {hasNonNullAssertionParent} from '../rules/utils/ast/ast-expressions';
import {isFunctionExpressionLike} from '../rules/utils/ast/ast-walk';
import {collectCallExpressions} from '../rules/utils/ast/call-expressions';
import {
    getAccessibilityGroup,
    isAccessibilityClassMember,
    isAccessorMember,
    isEcmascriptPrivateClassMember,
    isFieldLikeMember,
    isRelevantSpacingClassMember,
    shareAccessibilityGroup,
} from '../rules/utils/ast/class-members';
import {removeCommaSeparatedNode} from '../rules/utils/ast/comma-separated';
import {
    getContainingIfStatementForTestExpression,
    isConditionTestExpression,
    isEqualityComparisonOperand,
    isLogicalFallbackLeftOperand,
} from '../rules/utils/ast/condition-expressions';
import {getAvailableIdentifier, isIdentifier} from '../rules/utils/ast/identifiers';
import {isIndexedAccessGuardingSameIndexAssignment} from '../rules/utils/ast/indexed-access-narrowing';
import {
    getSafeBracketIndexText,
    isSameIndexedAccess,
} from '../rules/utils/ast/member-expressions';
import {
    collectMutationTargets,
    getMutationExpressionTarget,
    isMutationTarget,
} from '../rules/utils/ast/mutation-targets';
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
    getIndentAtOffset,
    getLeadingIndentation,
    getLineBreak,
    getLineEndOffset,
    getLineStartOffset,
    getNextLineStartOffset,
    hasBlankLine,
    hasBlankLineBetweenNodes,
    hasCommentLikeText,
    hasLineBreak,
    isLineBreakCharacter,
    isSingleLineNode,
    splitLines,
} from '../rules/utils/ast/spacing';
import {
    getStaticStringValue,
    isEmptyStaticString,
    isStaticString,
    isStringLiteral,
} from '../rules/utils/ast/string-literals';
import {dedent} from '../rules/utils/text/dedent';
import {supportsBuiltInAt} from '../rules/utils/typescript/compiler-options';
import {hasNamedDecorator} from '../rules/utils/typescript/decorators';
import {withCrLf} from './utils/line-endings';

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
        tokens: true,
    }).ast as unknown as TSESTree.Program;

    attachParents(ast);

    return ast;
}

function createSourceCodeText(code: string): Readonly<TSESLint.SourceCode> {
    return {
        getText(node: TSESTree.Node): string {
            return code.slice(node.range[0], node.range[1]);
        },
        text: code,
    } as unknown as Readonly<TSESLint.SourceCode>;
}

function getProgramTokens(program: TSESTree.Program): readonly TSESLint.AST.Token[] {
    const candidate = program as unknown;

    if (!candidate || typeof candidate !== 'object' || !('tokens' in candidate)) {
        return [];
    }

    const {tokens} = candidate as Record<'tokens', unknown>;

    return Array.isArray(tokens) ? (tokens as TSESLint.AST.Token[]) : [];
}

function createSourceCodeWithTokens(code: string): {
    readonly program: TSESTree.Program;
    readonly sourceCode: Readonly<TSESLint.SourceCode>;
} {
    const program = parseProgram(code);
    const tokens = getProgramTokens(program);

    return {
        program,
        sourceCode: {
            getText(node: TSESTree.Node): string {
                return code.slice(node.range[0], node.range[1]);
            },
            getTokenAfter(node: TSESTree.Node): TSESLint.AST.Token | null {
                return tokens.find((token) => token.range[0] >= node.range[1]) ?? null;
            },
            getTokenBefore(node: TSESTree.Node): TSESLint.AST.Token | null {
                for (let index = tokens.length - 1; index >= 0; index--) {
                    const token = tokens[index];

                    if (token && token.range[1] <= node.range[0]) {
                        return token;
                    }
                }

                return null;
            },
            text: code,
        } as unknown as Readonly<TSESLint.SourceCode>,
    };
}

function createRemoveRangeFixer(): TSESLint.RuleFixer {
    return {
        removeRange(range: TSESLint.AST.Range): TSESLint.RuleFix {
            return {range, text: ''};
        },
    } as unknown as TSESLint.RuleFixer;
}

function applyRuleFix(code: string, fix: TSESLint.RuleFix | null): string | null {
    return fix
        ? `${code.slice(0, fix.range[0])}${fix.text}${code.slice(fix.range[1])}`
        : null;
}

function parseTemplate(code: string): unknown {
    return require('@angular-eslint/template-parser').parseForESLint(code, {
        filePath: 'test.html',
    }).ast;
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

interface TestTextAttribute {
    readonly name: string;
    readonly value: string;
}

interface TestInputAttribute {
    readonly keySpan: {
        readonly details?: string;
    };
    readonly name: string;
}

interface TestOutputAttribute {
    readonly name: string;
}

function createTemplateElement({
    attributes = [],
    inputs = [],
    name = 'div',
    outputs = [],
}: {
    readonly attributes?: readonly TestTextAttribute[];
    readonly inputs?: readonly TestInputAttribute[];
    readonly name?: string;
    readonly outputs?: readonly TestOutputAttribute[];
}): TmplAstElement {
    return {attributes, inputs, name, outputs} as unknown as TmplAstElement;
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

    it('recognizes safe identifiers for generated code', () => {
        expect(isIdentifier('appearance')).toBe(true);
        expect(isIdentifier('$implicit')).toBe(true);
        expect(isIdentifier('_value2')).toBe(true);
        expect(isIdentifier('2value')).toBe(false);
        expect(isIdentifier('tui-avatar')).toBe(false);
        expect(isIdentifier('class')).toBe(false);
        expect(isIdentifier('await')).toBe(false);
        expect(isIdentifier('undefined')).toBe(false);
    });

    it('generates available identifier names', () => {
        expect(getAvailableIdentifier('appearance', new Set())).toBe('appearance');
        expect(getAvailableIdentifier('appearance', new Set(['appearance']))).toBe(
            'appearance2',
        );
        expect(
            getAvailableIdentifier('appearance', new Set(['appearance', 'appearance2'])),
        ).toBe('appearance3');
        expect(() => getAvailableIdentifier('tui-avatar', new Set())).toThrow(
            'Expected a valid identifier',
        );
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

    it('reads Angular template attributes through shared helpers', () => {
        const element = createTemplateElement({
            attributes: [{name: 'HREF', value: '/home'}],
            inputs: [
                {keySpan: {}, name: 'routerLink'},
                {keySpan: {details: 'attr.alt'}, name: 'alt'},
            ],
            outputs: [{name: 'click'}],
        });

        expect(getStaticAttribute(element, 'href')?.value).toBe('/home');
        expect(getStaticAttributeValue(element, 'href')).toBe('/home');
        expect(hasInputBinding(element, 'routerlink')).toBe(true);
        expect(hasAttributeBinding(element, 'alt')).toBe(true);
        expect(hasElementAttribute(element, ['title', 'href'])).toBe(true);
        expect(hasElementAttribute(element, ['href', 'routerLink'])).toBe(true);
        expect(hasElementAttribute(element, 'href')).toBe(true);
        expect(hasElementAttribute(element, 'alt')).toBe(true);
        expect(hasElementAttribute(element, 'title')).toBe(false);
        expect(hasOutputBinding(element)).toBe(true);
        expect(hasOutputBinding(element, 'click')).toBe(true);
        expect(hasOutputBinding(element, 'focus')).toBe(false);
    });

    it('recognizes interactive Angular template elements', () => {
        expect(
            isInteractiveElement(
                createTemplateElement({
                    attributes: [{name: 'href', value: '/home'}],
                    name: 'area',
                }),
            ),
        ).toBe(true);
        expect(isInteractiveElement(createTemplateElement({name: 'details'}))).toBe(true);
        expect(
            isInteractiveElement(
                createTemplateElement({
                    attributes: [{name: 'type', value: 'hidden'}],
                    name: 'input',
                }),
            ),
        ).toBe(false);
        expect(
            isInteractiveElement(
                createTemplateElement({
                    name: 'div',
                    outputs: [{name: 'click'}],
                }),
            ),
        ).toBe(false);
    });

    it('collects Angular template identifiers', () => {
        const names = collectTemplateIdentifiers(
            parseTemplate(`
                @let status = statusText();

                <input #search />

                <ng-template let-item>
                    {{ item }}
                </ng-template>
            `),
        );

        expect([...names].sort()).toEqual(['item', 'search', 'status']);
    });

    it('finds Angular template bound attributes for expression AST nodes', () => {
        const template = '<div [title]="active ? \'yes\' : fallback"></div>';
        const [node] = getTemplateNodes(parseTemplate(template));

        if (!node || !('inputs' in node)) {
            throw new Error('Expected a template node with inputs');
        }

        const container = node as TemplateAttributeContainer;
        const [attribute] = getBoundAttributes(container);

        if (!attribute) {
            throw new Error('Expected a bound attribute');
        }

        expect(isAstWithSource(attribute.value)).toBe(true);

        const expression = unwrapAstWithSource(attribute.value);

        if (!isConditional(expression)) {
            throw new Error('Expected a conditional expression');
        }

        expect(getContainingBoundAttribute(container, expression)).toBe(attribute);
        expect(
            containsAbsoluteSourceSpan(attribute.value.sourceSpan, expression.sourceSpan),
        ).toBe(true);
        expect(getAbsoluteSourceSpanText(template, expression.sourceSpan)).toBe(
            "active ? 'yes' : fallback",
        );

        // noinspection AngularMissingRequiredDirectiveInputBinding
        const structuralTemplate = '<div *ngIf="visible"></div>';
        const [templateNode] = getTemplateNodes(parseTemplate(structuralTemplate));

        if (!templateNode || !('templateAttrs' in templateNode)) {
            throw new Error('Expected a structural template node');
        }

        expect(
            getBoundAttributes(templateNode as TemplateAttributeContainer).map(
                ({name}) => name,
            ),
        ).toContain('ngIf');
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
                #secret = 1;
                protected readonly field = 1;
                protected accessor cached = 0;
                abstract title: string;
                get value() { return this.field; }
                set value(next: number) { this.field = next; }
                static {}
            }
        `).body[0];

        if (classDeclaration?.type !== AST_NODE_TYPES.ClassDeclaration) {
            throw new Error('Expected a class declaration');
        }

        const [
            secretField,
            field,
            accessorProperty,
            abstractField,
            getter,
            setter,
            staticBlock,
        ] = classDeclaration.body.body;

        if (
            !secretField ||
            !field ||
            !accessorProperty ||
            !abstractField ||
            !getter ||
            !setter ||
            !staticBlock
        ) {
            throw new Error('Expected class members');
        }

        expect(isFieldLikeMember(field)).toBe(true);
        expect(isFieldLikeMember(abstractField)).toBe(true);
        expect(isAccessorMember(getter)).toBe(true);
        expect(isAccessorMember(setter)).toBe(true);
        expect(isEcmascriptPrivateClassMember(secretField)).toBe(true);
        expect(isAccessibilityClassMember(secretField)).toBe(true);
        expect(isAccessibilityClassMember(staticBlock)).toBe(false);

        if (
            !isAccessibilityClassMember(secretField) ||
            !isAccessibilityClassMember(accessorProperty) ||
            !isAccessibilityClassMember(abstractField) ||
            !isAccessibilityClassMember(getter)
        ) {
            throw new Error('Expected accessibility class members');
        }

        expect(getAccessibilityGroup(secretField)).toBe('private');
        expect(getAccessibilityGroup(accessorProperty)).toBe('protected');
        expect(getAccessibilityGroup(abstractField)).toBe('public');
        expect(shareAccessibilityGroup(secretField, accessorProperty)).toBe(false);
        expect(shareAccessibilityGroup(abstractField, getter)).toBe(true);
        expect(isRelevantSpacingClassMember(getter)).toBe(true);
        expect(isSingleLineNode(field)).toBe(true);
    });

    it('handles line-break and spacing helpers for text gaps', () => {
        expect(hasCommentLikeText(' /* note */ ')).toBe(true);
        expect(hasCommentLikeText('\n    // note')).toBe(true);
        expect(hasCommentLikeText('\n    next')).toBe(false);
        expect(hasBlankLine('\n\n    next')).toBe(true);
        expect(hasBlankLine('\r\n\r\n    next')).toBe(true);
        expect(hasBlankLine('\n    next')).toBe(false);
        expect(hasBlankLineBetweenNodes('\n\n    next')).toBe(true);
        expect(hasBlankLineBetweenNodes('\n    // note\n    next')).toBe(false);
        expect(hasBlankLineBetweenNodes('\n\n    // note\n    next')).toBe(true);
        expect(getLineBreak('\r\n    next')).toBe('\r\n');
        expect(getLineBreak('\r    next')).toBe('\r');
        expect(getLineBreak('\n    next')).toBe('\n');
        expect(hasLineBreak('same line')).toBe(false);
        expect(hasLineBreak('first\r\nsecond')).toBe(true);
        expect(isLineBreakCharacter('\r')).toBe(true);
        expect(isLineBreakCharacter(' ')).toBe(false);
        expect(splitLines('first\r\nsecond\nthird\rfourth')).toEqual([
            'first',
            'second',
            'third',
            'fourth',
        ]);
        expect(getLeadingIndentation('    value')).toBe('    ');
        expect(getLeadingIndentation('\t\tvalue')).toBe('\t\t');
        expect(getLeadingIndentation('value')).toBe('');
        expect(getLineEndOffset('<div>\r\n    <span></span>', 0)).toBe(5);
        expect(getNextLineStartOffset('<div>\r\n    <span></span>', 0)).toBe(7);
        expect(getNextLineStartOffset('first\r\nsecond', 5)).toBe(7);
        expect(getNextLineStartOffset('first\rsecond', 5)).toBe(6);
        expect(getNextLineStartOffset('first\nsecond', 5)).toBe(6);
        expect(getNextLineStartOffset('first', 0)).toBe(0);
        expect(getLineStartOffset('<div>\n    <span></span>', 10)).toBe(6);
        expect(getLineStartOffset('<div>\r\n    <span></span>', 11)).toBe(7);
        expect(getLineStartOffset('first\r\nsecond', 7)).toBe(7);
        expect(getLineEndOffset('first\r\nsecond', 7)).toBe(13);
        expect(getIndentAtOffset('<div>\n    <span></span>', 10)).toBe('    ');
        expect(getIndentAtOffset('<div>\r\n    <span></span>', 11)).toBe('    ');
        expect(getIndentAtOffset('<div>\ntext<span></span>', 10)).toBe('');
    });

    it('removes inline comma-separated nodes with the following comma', () => {
        const code = "writeFile(file, content, {encoding: 'utf8'}, callback);";
        const {program, sourceCode} = createSourceCodeWithTokens(code);
        const [statement] = program.body;

        if (
            statement?.type !== AST_NODE_TYPES.ExpressionStatement ||
            statement.expression.type !== AST_NODE_TYPES.CallExpression
        ) {
            throw new Error('Expected a call expression');
        }

        const [, previousArgument, options, nextArgument] =
            statement.expression.arguments;

        if (!previousArgument || !options || !nextArgument) {
            throw new Error('Expected neighboring arguments');
        }

        const fix = removeCommaSeparatedNode(
            sourceCode,
            createRemoveRangeFixer(),
            options,
            previousArgument,
            nextArgument,
        );

        expect(applyRuleFix(code, fix)).toBe('writeFile(file, content, callback);');
    });

    it('removes standalone comma-separated lines while preserving CRLF', () => {
        const code = withCrLf(`
            const options = {
                flag: 'wx',
                encoding: 'utf8',
            };
        `);

        const {program, sourceCode} = createSourceCodeWithTokens(code);
        const [statement] = program.body;

        if (statement?.type !== AST_NODE_TYPES.VariableDeclaration) {
            throw new Error('Expected a variable declaration');
        }

        const objectExpression = statement.declarations[0].init;

        if (objectExpression?.type !== AST_NODE_TYPES.ObjectExpression) {
            throw new Error('Expected an object expression');
        }

        const [previousProperty, encodingProperty] = objectExpression.properties;

        if (!previousProperty || !encodingProperty) {
            throw new Error('Expected neighboring properties');
        }

        const fix = removeCommaSeparatedNode(
            sourceCode,
            createRemoveRangeFixer(),
            encodingProperty,
            previousProperty,
            null,
        );

        expect(applyRuleFix(code, fix)).toBe(
            withCrLf(`
            const options = {
                flag: 'wx',
            };
        `),
        );
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

    it('recognizes indexed access guards that protect same-index mutations', () => {
        const code = 'if (event.data[0]) { event.data[0] += 16; }';
        const sourceCode = createSourceCodeText(code);
        const [statement] = parseProgram(code).body;

        if (
            statement?.type !== AST_NODE_TYPES.IfStatement ||
            statement.test.type !== AST_NODE_TYPES.MemberExpression ||
            statement.consequent.type !== AST_NODE_TYPES.BlockStatement
        ) {
            throw new Error('Expected an indexed access if statement');
        }

        const [bodyStatement] = statement.consequent.body;

        if (
            bodyStatement?.type !== AST_NODE_TYPES.ExpressionStatement ||
            bodyStatement.expression.type !== AST_NODE_TYPES.AssignmentExpression ||
            bodyStatement.expression.left.type !== AST_NODE_TYPES.MemberExpression
        ) {
            throw new Error('Expected an indexed access mutation');
        }

        const testAccess = statement.test;
        const assignment = bodyStatement.expression;
        const assignmentAccess = assignment.left;

        expect(getParentNode(testAccess)).toBe(statement);
        expect(getSafeBracketIndexText(sourceCode, testAccess)).toBe('0');
        expect(getContainingIfStatementForTestExpression(testAccess)).toBe(statement);
        expect(isConditionTestExpression(testAccess)).toBe(true);
        expect(isIndexedAccessGuardingSameIndexAssignment(sourceCode, testAccess)).toBe(
            true,
        );
        expect(getMutationExpressionTarget(assignment)).toBe(assignmentAccess);
        expect(isMutationTarget(assignmentAccess)).toBe(true);
        expect(isSameIndexedAccess(sourceCode, testAccess, assignmentAccess)).toBe(true);
    });

    it('recognizes reusable expression context helpers', () => {
        const fallback = getFirstExpression('values[0] ?? fallback');
        const equality = getFirstExpression('color[3] === opacity');
        const asserted = getFirstExpression('(values[0])!');

        if (
            fallback.type !== AST_NODE_TYPES.LogicalExpression ||
            fallback.left.type !== AST_NODE_TYPES.MemberExpression ||
            equality.type !== AST_NODE_TYPES.BinaryExpression ||
            equality.left.type !== AST_NODE_TYPES.MemberExpression ||
            asserted.type !== AST_NODE_TYPES.TSNonNullExpression ||
            asserted.expression.type !== AST_NODE_TYPES.MemberExpression
        ) {
            throw new Error('Expected logical and equality expressions');
        }

        expect(isLogicalFallbackLeftOperand(fallback.left)).toBe(true);
        expect(isEqualityComparisonOperand(equality.left)).toBe(true);
        expect(hasNonNullAssertionParent(asserted.expression)).toBe(true);
    });

    it('detects function expression boundaries and built-in at support', () => {
        const arrow = getFirstExpression('() => value');

        expect(isFunctionExpressionLike(arrow)).toBe(true);
        expect(
            supportsBuiltInAt({
                lib: ['es2021', 'dom'],
                target: ScriptTarget.ES2022,
            }),
        ).toBe(false);
        expect(
            supportsBuiltInAt({
                lib: ['es2022', 'dom'],
                target: ScriptTarget.ES2022,
            }),
        ).toBe(true);
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
