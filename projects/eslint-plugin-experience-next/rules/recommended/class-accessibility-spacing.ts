import {type TSESTree} from '@typescript-eslint/utils';

import {
    getAccessibilityGroup,
    isAccessibilityClassMember,
} from '../utils/ast/class-members';
import {
    getSpacingReplacement,
    hasBlankLineBetweenNodes,
    hasCommentLikeText,
} from '../utils/ast/spacing';
import {createRule} from '../utils/create-rule';

type MessageIds = 'classAccessibilitySpacing';

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
                        !isAccessibilityClassMember(current) ||
                        !isAccessibilityClassMember(next)
                    ) {
                        continue;
                    }

                    const accessibilityGroupChanged =
                        getAccessibilityGroup(current) !== getAccessibilityGroup(next);

                    if (!accessibilityGroupChanged) {
                        continue;
                    }

                    const betweenText = sourceCode.text.slice(
                        current.range[1],
                        next.range[0],
                    );

                    const missingBlankLine = !hasBlankLineBetweenNodes(betweenText);

                    if (!missingBlankLine) {
                        continue;
                    }

                    const reportTarget = {
                        messageId: 'classAccessibilitySpacing' as const,
                        node: next,
                    };

                    if (hasCommentLikeText(betweenText)) {
                        context.report(reportTarget);

                        continue;
                    }

                    context.report({
                        ...reportTarget,
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
                    });
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Require a blank line between adjacent class members when their accessibility group changes',
        },
        fixable: 'code',
        messages: {
            classAccessibilitySpacing:
                'Class members with different accessibility groups should be separated by a blank line',
        },
        schema: [],
        type: 'layout',
    },
    name: 'class-accessibility-spacing',
});

export default rule;
