import {type TSESTree} from '@typescript-eslint/utils';

import {
    isAccessorMember,
    isFieldLikeMember,
    isRelevantSpacingClassMember,
} from '../utils/ast/class-members';
import {
    getSpacingReplacement,
    hasBlankLine,
    hasCommentLikeText,
    isSingleLineNode,
} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';

type MessageIds =
    | 'missingBlankLineAfterMultilineProperty'
    | 'missingBlankLineAroundAccessor'
    | 'missingBlankLineBeforeMultilineProperty'
    | 'unexpectedBlankLineBeforeNextSingleLineField';

export const rule = createRule<[], MessageIds>({
    create(context) {
        const sourceCode = context.sourceCode;

        return {
            ClassBody(node: TSESTree.ClassBody) {
                for (let index = 0; index < node.body.length - 1; index++) {
                    const current = node.body[index];
                    const next = node.body[index + 1];

                    if (
                        !current ||
                        !next ||
                        !isRelevantSpacingClassMember(current) ||
                        !isRelevantSpacingClassMember(next)
                    ) {
                        continue;
                    }

                    const betweenText = sourceCode.text.slice(
                        current.range[1],
                        next.range[0],
                    );

                    if (hasCommentLikeText(betweenText)) {
                        continue;
                    }

                    const currentIsSingleLine = isSingleLineNode(current);
                    const blankLineBetween = hasBlankLine(betweenText);

                    const needsSeparatedLine =
                        isAccessorMember(current) || isAccessorMember(next);

                    if (
                        isFieldLikeMember(current) &&
                        isFieldLikeMember(next) &&
                        currentIsSingleLine &&
                        isSingleLineNode(next) &&
                        blankLineBetween
                    ) {
                        context.report({
                            fix: (fixer) =>
                                fixer.replaceTextRange(
                                    [current.range[1], next.range[0]],
                                    getSpacingReplacement(
                                        sourceCode,
                                        betweenText,
                                        next.loc.start.line,
                                        0,
                                    ),
                                ),
                            messageId: 'unexpectedBlankLineBeforeNextSingleLineField',
                            node: next,
                        });

                        continue;
                    }

                    if (needsSeparatedLine && !blankLineBetween) {
                        context.report({
                            fix: (fixer) =>
                                fixer.replaceTextRange(
                                    [current.range[1], next.range[0]],
                                    getSpacingReplacement(
                                        sourceCode,
                                        betweenText,
                                        next.loc.start.line,
                                        1,
                                    ),
                                ),
                            messageId: 'missingBlankLineAroundAccessor',
                            node: next,
                        });

                        continue;
                    }

                    if (
                        isFieldLikeMember(current) &&
                        isFieldLikeMember(next) &&
                        currentIsSingleLine &&
                        !isSingleLineNode(next) &&
                        !blankLineBetween
                    ) {
                        context.report({
                            fix: (fixer) =>
                                fixer.replaceTextRange(
                                    [current.range[1], next.range[0]],
                                    getSpacingReplacement(
                                        sourceCode,
                                        betweenText,
                                        next.loc.start.line,
                                        1,
                                    ),
                                ),
                            messageId: 'missingBlankLineBeforeMultilineProperty',
                            node: next,
                        });

                        continue;
                    }

                    if (
                        isFieldLikeMember(current) &&
                        isFieldLikeMember(next) &&
                        !currentIsSingleLine &&
                        !blankLineBetween
                    ) {
                        context.report({
                            fix: (fixer) =>
                                fixer.replaceTextRange(
                                    [current.range[1], next.range[0]],
                                    getSpacingReplacement(
                                        sourceCode,
                                        betweenText,
                                        next.loc.start.line,
                                        1,
                                    ),
                                ),
                            messageId: 'missingBlankLineAfterMultilineProperty',
                            node: next,
                        });
                    }
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Group consecutive single-line fields together, while separating multiline fields and accessors with blank lines',
        },
        fixable: 'code',
        messages: {
            missingBlankLineAfterMultilineProperty:
                'Multiline field-like members should be followed by a blank line before the next field',
            missingBlankLineAroundAccessor:
                'Getter and setter members should be separated from surrounding fields by a blank line',
            missingBlankLineBeforeMultilineProperty:
                'Multiline field-like members should be preceded by a blank line after single-line fields',
            unexpectedBlankLineBeforeNextSingleLineField:
                'Single-line fields should not be separated by a blank line before the next single-line field',
        },
        schema: [],
        type: 'layout',
    },
    name: 'single-line-class-property-spacing',
});

export default rule;
