import {
    type ParseSourceSpan,
    TmplAstDeferredBlock,
    TmplAstElement,
    TmplAstForLoopBlock,
    TmplAstIfBlock,
    TmplAstLetDeclaration,
    TmplAstSwitchBlock,
    TmplAstTemplate,
    TmplAstText,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {getTemplateNodes} from '../utils/angular/template-identifiers';
import {getLeadingIndentation, getLineBreak, hasBlankLine} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';
import {INLINE_HTML_ELEMENTS} from '../utils/html/inline-elements';

const SKIP_CHILDREN = new Set(['code', 'pre', 'script', 'style', 'textarea']);

interface SpannedNode {
    sourceSpan: ParseSourceSpan;
}

function hasSourceSpan(node: unknown): node is SpannedNode {
    return typeof node === 'object' && node !== null && 'sourceSpan' in node;
}

function isControlFlowBlock(node: unknown): boolean {
    return (
        node instanceof TmplAstDeferredBlock ||
        node instanceof TmplAstForLoopBlock ||
        node instanceof TmplAstIfBlock ||
        node instanceof TmplAstSwitchBlock
    );
}

function isMarkup(node: unknown): boolean {
    return node instanceof TmplAstElement || node instanceof TmplAstTemplate;
}

function needsBlankLine(previous: unknown, next: unknown): boolean {
    const previousStartsSection =
        previous instanceof TmplAstLetDeclaration || isControlFlowBlock(previous);

    return (
        (previousStartsSection && (isMarkup(next) || isControlFlowBlock(next))) ||
        (isMarkup(previous) && isControlFlowBlock(next))
    );
}

export const rule = createRule({
    name: 'template-block-spacing',
    rule: {
        create(context: Rule.RuleContext) {
            const {sourceCode} = context;
            const sourceText = sourceCode.getText();
            const lineBreak = getLineBreak(sourceText);

            function checkChildren(children: readonly unknown[]): void {
                let previous: unknown = null;

                for (const current of children) {
                    if (current instanceof TmplAstText && current.value.trim() === '') {
                        continue;
                    }

                    if (
                        needsBlankLine(previous, current) &&
                        hasSourceSpan(previous) &&
                        hasSourceSpan(current)
                    ) {
                        const start = previous.sourceSpan.end.offset;
                        const end = current.sourceSpan.start.offset;
                        const betweenText = sourceText.slice(start, end);
                        const alreadySeparated = hasBlankLine(betweenText);
                        const areOnSeparateLines =
                            previous.sourceSpan.end.line < current.sourceSpan.start.line;

                        const needsSpacing =
                            areOnSeparateLines &&
                            !alreadySeparated &&
                            betweenText.trim() === '';

                        if (needsSpacing) {
                            const indentation = getLeadingIndentation(
                                sourceCode.lines[current.sourceSpan.start.line] ?? '',
                            );

                            context.report({
                                fix: (fixer) =>
                                    fixer.replaceTextRange(
                                        [start, end],
                                        `${lineBreak.repeat(2)}${indentation}`,
                                    ),
                                loc: sourceSpanToLoc(current.sourceSpan),
                                messageId: 'templateBlockSpacingMissingBlankLine',
                            });
                        }
                    }

                    previous = current;
                }
            }

            function getChildren(rawNode: unknown): readonly unknown[] {
                if (
                    typeof rawNode === 'object' &&
                    rawNode !== null &&
                    'children' in rawNode
                ) {
                    const {children} = rawNode;

                    return Array.isArray(children) ? children : [];
                }

                return [];
            }

            return {
                DeferredBlock(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                DeferredBlockError(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                DeferredBlockLoading(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                DeferredBlockPlaceholder(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                Element(rawNode: unknown) {
                    if (!(rawNode instanceof TmplAstElement)) {
                        return;
                    }

                    const node = rawNode;

                    if (
                        SKIP_CHILDREN.has(node.name) ||
                        INLINE_HTML_ELEMENTS.has(node.name)
                    ) {
                        return;
                    }

                    checkChildren(node.children);
                },
                ForLoopBlock(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                ForLoopBlockEmpty(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                IfBlockBranch(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                'Program:exit'() {
                    checkChildren(getTemplateNodes(sourceCode.ast));
                },
                SwitchBlockCase(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
                Template(rawNode: unknown) {
                    checkChildren(getChildren(rawNode));
                },
            };
        },
        meta: {
            docs: {
                description:
                    'Require blank lines between Angular template declarations, control-flow blocks, and adjacent markup sections',
            },
            fixable: 'code',
            messages: {
                templateBlockSpacingMissingBlankLine:
                    'Separate adjacent template sections with a blank line',
            },
            schema: [],
            type: 'layout',
        },
    },
});

export default rule;
