import {
    TmplAstBoundText,
    TmplAstLetDeclaration,
    TmplAstText,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {getTemplateNodes} from '../utils/angular/template-identifiers';
import {getLeadingIndentation, getLineBreak, hasBlankLine} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';

export const rule = createRule({
    name: 'single-line-let-spacing',
    rule: {
        create(context: Rule.RuleContext) {
            const {sourceCode} = context;
            const sourceText = sourceCode.getText();

            function buildSpacingReplacement(
                betweenText: string,
                nextLine: number,
                blankLineCount: number,
            ): string {
                const lineBreak = getLineBreak(betweenText);

                const indentation = getLeadingIndentation(
                    sourceCode.lines[nextLine] ?? '',
                );

                return `${lineBreak.repeat(blankLineCount + 1)}${indentation}`;
            }

            function checkChildren(children: readonly unknown[]): void {
                for (let i = 0; i < children.length; i++) {
                    const current = children[i];

                    if (!(current instanceof TmplAstLetDeclaration)) {
                        continue;
                    }

                    let j = i + 1;

                    while (j < children.length) {
                        const candidate = children[j];

                        const isWhitespaceText =
                            candidate instanceof TmplAstText &&
                            candidate.value.trim() === '';

                        if (!isWhitespaceText) {
                            break;
                        }

                        j++;
                    }

                    const next = children[j];

                    if (
                        !(next instanceof TmplAstLetDeclaration) &&
                        !(next instanceof TmplAstBoundText)
                    ) {
                        continue;
                    }

                    const currentEnd = current.sourceSpan.end.offset;
                    const nextStart = next.sourceSpan.start.offset;
                    const betweenText = sourceText.slice(currentEnd, nextStart);

                    const hasComment =
                        betweenText.includes('//') ||
                        betweenText.includes('/*') ||
                        betweenText.includes('<!--');

                    if (hasComment) {
                        continue;
                    }

                    const blankLineBetween = hasBlankLine(betweenText);
                    const nextLine = next.sourceSpan.start.line;

                    if (next instanceof TmplAstLetDeclaration) {
                        const currentIsSingleLine =
                            current.sourceSpan.start.line === current.sourceSpan.end.line;

                        const nextIsSingleLine =
                            next.sourceSpan.start.line === next.sourceSpan.end.line;

                        if (currentIsSingleLine && nextIsSingleLine && blankLineBetween) {
                            context.report({
                                fix: (fixer) =>
                                    fixer.replaceTextRange(
                                        [currentEnd, nextStart],
                                        buildSpacingReplacement(betweenText, nextLine, 0),
                                    ),
                                loc: sourceSpanToLoc(next.sourceSpan),
                                messageId: 'singleLineLetSpacingUnexpectedBlankLine',
                            });

                            continue;
                        }

                        if (
                            currentIsSingleLine &&
                            !nextIsSingleLine &&
                            !blankLineBetween
                        ) {
                            context.report({
                                fix: (fixer) =>
                                    fixer.replaceTextRange(
                                        [currentEnd, nextStart],
                                        buildSpacingReplacement(betweenText, nextLine, 1),
                                    ),
                                loc: sourceSpanToLoc(next.sourceSpan),
                                messageId:
                                    'singleLineLetSpacingMissingBlankLineBeforeMultilineLet',
                            });

                            continue;
                        }

                        if (!currentIsSingleLine && !blankLineBetween) {
                            context.report({
                                fix: (fixer) =>
                                    fixer.replaceTextRange(
                                        [currentEnd, nextStart],
                                        buildSpacingReplacement(betweenText, nextLine, 1),
                                    ),
                                loc: sourceSpanToLoc(next.sourceSpan),
                                messageId:
                                    'singleLineLetSpacingMissingBlankLineAfterMultilineLet',
                            });
                        }

                        continue;
                    }

                    if (!blankLineBetween) {
                        context.report({
                            fix: (fixer) =>
                                fixer.replaceTextRange(
                                    [currentEnd, nextStart],
                                    buildSpacingReplacement(betweenText, nextLine, 1),
                                ),
                            loc: sourceSpanToLoc(next.sourceSpan),
                            messageId:
                                'singleLineLetSpacingMissingBlankLineBeforeInterpolation',
                        });
                    }
                }
            }

            function getChildren(rawNode: unknown): readonly unknown[] {
                if (
                    typeof rawNode === 'object' &&
                    rawNode !== null &&
                    'children' in rawNode
                ) {
                    const {children} = rawNode as Record<'children', unknown>;

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
                    checkChildren(getChildren(rawNode));
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
                    'Group consecutive single-line @let declarations together, while separating multiline declarations and interpolations with blank lines',
            },
            fixable: 'code',
            messages: {
                singleLineLetSpacingMissingBlankLineAfterMultilineLet:
                    'Multiline @let declarations should be followed by a blank line',
                singleLineLetSpacingMissingBlankLineBeforeInterpolation:
                    '@let declarations should be separated from the following interpolation by a blank line',
                singleLineLetSpacingMissingBlankLineBeforeMultilineLet:
                    'Multiline @let declarations should be preceded by a blank line',
                singleLineLetSpacingUnexpectedBlankLine:
                    'Single-line @let declarations should not be separated by a blank line',
            },
            schema: [],
            type: 'layout',
        },
    },
});

export default rule;
