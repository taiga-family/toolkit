import {
    type AST,
    type Conditional,
    type TmplAstBoundText,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {getAbsoluteSourceSpanText} from '../utils/angular/source-span';
import {
    getContainingBoundAttribute,
    type TemplateAttributeContainer,
} from '../utils/angular/template-attributes';
import {isConditional} from '../utils/angular/template-expressions';
import {collectTemplateIdentifiers} from '../utils/angular/template-identifiers';
import {getAvailableIdentifier, isIdentifier} from '../utils/ast/identifiers';
import {getIndentAtOffset, getLineBreak} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'noNestedTernaryInTemplate';

const MESSAGE =
    'Avoid nested ternary expressions in Angular templates. Move the nested branch into an @let declaration.';

interface LetFix {
    readonly expression: string;
    readonly name: string;
}

function createLetFixes(
    node: Conditional,
    baseName: string,
    unavailableNames: Set<string>,
    text: string,
): {readonly lets: readonly LetFix[]; readonly reference: string} {
    const name = getAvailableIdentifier(baseName, unavailableNames);

    unavailableNames.add(name);

    const nestedLets: LetFix[] = [];

    const render = (child: AST): string => {
        if (isConditional(child)) {
            const result = createLetFixes(child, baseName, unavailableNames, text);

            nestedLets.push(...result.lets);

            return result.reference;
        }

        return getAbsoluteSourceSpanText(text, child.sourceSpan);
    };

    const condition = render(node.condition);
    const trueExp = render(node.trueExp);
    const falseExp = render(node.falseExp);

    return {
        lets: [
            ...nestedLets,
            {
                expression: `${condition} ? ${trueExp} : ${falseExp}`,
                name,
            },
        ],
        reference: name,
    };
}

export const rule = createRule({
    name: 'no-nested-ternary-in-template',
    rule: {
        create(context: Rule.RuleContext) {
            const {sourceCode} = context;
            const boundTextStack: TmplAstBoundText[] = [];
            const conditionalStack: Conditional[] = [];
            const containerStack: TemplateAttributeContainer[] = [];
            const letNames = collectTemplateIdentifiers(sourceCode.ast);
            let boundEventDepth = 0;
            let letDeclarationDepth = 0;

            function reportNestedConditional(
                node: Conditional,
                options: {readonly allowFix: boolean},
            ): void {
                const container = containerStack[containerStack.length - 1];
                const attribute = getContainingBoundAttribute(container, node);
                const boundText = boundTextStack[boundTextStack.length - 1];
                const baseName = attribute?.name;

                const fixable =
                    options.allowFix &&
                    boundEventDepth === 0 &&
                    letDeclarationDepth === 0 &&
                    ((baseName !== undefined && isIdentifier(baseName)) ||
                        boundText !== undefined);

                context.report({
                    ...(fixable
                        ? {
                              fix(fixer) {
                                  const effectiveName = baseName ?? 'text';

                                  const result = createLetFixes(
                                      node,
                                      effectiveName,
                                      letNames,
                                      sourceCode.text,
                                  );

                                  const insertOffset =
                                      baseName === undefined
                                          ? boundText?.sourceSpan.start.offset
                                          : container?.startSourceSpan.start.offset;

                                  if (insertOffset === undefined) {
                                      return null;
                                  }

                                  const indent = getIndentAtOffset(
                                      sourceCode.text,
                                      insertOffset,
                                  );

                                  const lineBreak = getLineBreak(sourceCode.text);

                                  const declarations = result.lets
                                      .map(
                                          ({expression, name}, index) =>
                                              `${index === 0 ? '' : indent}@let ${name} = ${expression};`,
                                      )
                                      .join(lineBreak);

                                  return [
                                      fixer.insertTextBeforeRange(
                                          [insertOffset, insertOffset],
                                          `${declarations}${lineBreak}${indent}`,
                                      ),
                                      fixer.replaceTextRange(
                                          [node.sourceSpan.start, node.sourceSpan.end],
                                          result.reference,
                                      ),
                                  ];
                              },
                          }
                        : {}),
                    loc: {
                        end: sourceCode.getLocFromIndex(node.sourceSpan.end),
                        start: sourceCode.getLocFromIndex(node.sourceSpan.start),
                    },
                    messageId: MESSAGE_ID,
                });
            }

            return {
                BoundEvent() {
                    boundEventDepth++;
                },
                'BoundEvent:exit'() {
                    boundEventDepth--;
                },
                BoundText(rawNode: unknown) {
                    boundTextStack.push(rawNode as TmplAstBoundText);
                },
                'BoundText:exit'(rawNode: unknown) {
                    if (boundTextStack[boundTextStack.length - 1] === rawNode) {
                        boundTextStack.pop();
                    }
                },
                Conditional(rawNode: unknown) {
                    const node = rawNode as Conditional;

                    if (conditionalStack.length > 0) {
                        reportNestedConditional(node, {
                            allowFix: conditionalStack.length === 1,
                        });
                    }

                    conditionalStack.push(node);
                },
                'Conditional:exit'(rawNode: unknown) {
                    const node = rawNode as Conditional;

                    if (conditionalStack[conditionalStack.length - 1] === node) {
                        conditionalStack.pop();
                    }
                },
                Element(rawNode: unknown) {
                    containerStack.push(rawNode as TemplateAttributeContainer);
                },
                'Element:exit'(rawNode: unknown) {
                    if (containerStack[containerStack.length - 1] === rawNode) {
                        containerStack.pop();
                    }
                },
                LetDeclaration() {
                    letDeclarationDepth++;
                },
                'LetDeclaration:exit'() {
                    letDeclarationDepth--;
                },
                Template(rawNode: unknown) {
                    containerStack.push(rawNode as TemplateAttributeContainer);
                },
                'Template:exit'(rawNode: unknown) {
                    if (containerStack[containerStack.length - 1] === rawNode) {
                        containerStack.pop();
                    }
                },
            };
        },
        meta: {
            docs: {description: MESSAGE},
            fixable: 'code',
            messages: {[MESSAGE_ID]: MESSAGE},
            schema: [],
            type: 'suggestion',
        },
    },
});

export default rule;
