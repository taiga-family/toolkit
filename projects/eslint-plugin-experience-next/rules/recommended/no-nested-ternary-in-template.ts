import {
    type AST,
    type Conditional,
    TmplAstBoundAttribute,
    type TmplAstElement,
    type TmplAstLetDeclaration,
    TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {getAvailableIdentifier, isIdentifier} from '../utils/ast/identifiers';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'noNestedTernaryInTemplate';

const MESSAGE =
    'Avoid nested ternary expressions in Angular templates. Move the nested branch into an @let declaration.';

type TemplateContainer = TmplAstElement | TmplAstTemplate;

function isBoundAttribute(node: unknown): node is TmplAstBoundAttribute {
    return node instanceof TmplAstBoundAttribute;
}

function getBoundAttributes(
    container: TemplateContainer,
): readonly TmplAstBoundAttribute[] {
    return container instanceof TmplAstTemplate
        ? [...container.inputs, ...container.templateAttrs.filter(isBoundAttribute)]
        : container.inputs;
}

function containsAst(attribute: TmplAstBoundAttribute, node: AST): boolean {
    const {sourceSpan} = attribute.value;

    return (
        sourceSpan.start <= node.sourceSpan.start && node.sourceSpan.end <= sourceSpan.end
    );
}

function getContainingAttribute(
    container: TemplateContainer | undefined,
    node: AST,
): TmplAstBoundAttribute | null {
    return container
        ? (getBoundAttributes(container).find((attribute) =>
              containsAst(attribute, node),
          ) ?? null)
        : null;
}

function getIndent(text: string, offset: number): string {
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
    const indent = text.slice(lineStart, offset);

    return indent.trim() === '' ? indent : '';
}

export const rule = createRule({
    name: 'no-nested-ternary-in-template',
    rule: {
        create(context: Rule.RuleContext) {
            const {sourceCode} = context;
            const conditionalStack: Conditional[] = [];
            const containerStack: TemplateContainer[] = [];
            const letNames = new Set<string>();
            let boundEventDepth = 0;
            let letDeclarationDepth = 0;

            function reportNestedConditional(node: Conditional): void {
                const container = containerStack[containerStack.length - 1];
                const attribute = getContainingAttribute(container, node);
                const baseName = attribute?.name;
                const fixable = baseName && isIdentifier(baseName);

                context.report({
                    ...(fixable
                        ? {
                              fix(fixer) {
                                  const letName = getAvailableIdentifier(
                                      baseName,
                                      letNames,
                                  );

                                  const insertOffset =
                                      container?.startSourceSpan.start.offset;

                                  if (insertOffset === undefined) {
                                      return null;
                                  }

                                  const expression = sourceCode.text.slice(
                                      node.sourceSpan.start,
                                      node.sourceSpan.end,
                                  );

                                  const indent = getIndent(sourceCode.text, insertOffset);

                                  return [
                                      fixer.insertTextBeforeRange(
                                          [insertOffset, insertOffset],
                                          `@let ${letName} = ${expression};\n\n${indent}`,
                                      ),
                                      fixer.replaceTextRange(
                                          [node.sourceSpan.start, node.sourceSpan.end],
                                          letName,
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
                Conditional(rawNode: unknown) {
                    const node = rawNode as Conditional;

                    if (
                        conditionalStack.length > 0 &&
                        boundEventDepth === 0 &&
                        letDeclarationDepth === 0
                    ) {
                        reportNestedConditional(node);
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
                    containerStack.push(rawNode as TmplAstElement);
                },
                'Element:exit'(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (containerStack[containerStack.length - 1] === node) {
                        containerStack.pop();
                    }
                },
                LetDeclaration(rawNode: unknown) {
                    const node = rawNode as TmplAstLetDeclaration;

                    letNames.add(node.name);
                    letDeclarationDepth++;
                },
                'LetDeclaration:exit'() {
                    letDeclarationDepth--;
                },
                Template(rawNode: unknown) {
                    containerStack.push(rawNode as TmplAstTemplate);
                },
                'Template:exit'(rawNode: unknown) {
                    const node = rawNode as TmplAstTemplate;

                    if (containerStack[containerStack.length - 1] === node) {
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
