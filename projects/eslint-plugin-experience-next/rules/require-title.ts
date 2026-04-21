import {
    TmplAstBoundText,
    TmplAstElement,
    TmplAstText,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';
import {createRule} from './utils/create-rule';

const MESSAGE_IDS = {
    EMPTY_TITLE: 'empty',
    MISSING_TITLE: 'missing',
} as const;

function hasMeaningfulTitleContent(node: TmplAstElement): boolean {
    return node.children.some(
        (child) =>
            child instanceof TmplAstBoundText ||
            (child instanceof TmplAstText && child.value.trim().length > 0),
    );
}

export const rule = createRule({
    name: 'require-title',
    rule: {
        create(context: Rule.RuleContext) {
            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (node.name !== 'head') {
                        return;
                    }

                    const title = node.children.find(
                        (child): child is TmplAstElement =>
                            child instanceof TmplAstElement && child.name === 'title',
                    );

                    if (!title) {
                        context.report({
                            loc: sourceSpanToLoc(node.startSourceSpan),
                            messageId: MESSAGE_IDS.MISSING_TITLE,
                        });

                        return;
                    }

                    if (!hasMeaningfulTitleContent(title)) {
                        context.report({
                            loc: sourceSpanToLoc(title.startSourceSpan),
                            messageId: MESSAGE_IDS.EMPTY_TITLE,
                        });
                    }
                },
            };
        },
        meta: {
            docs: {description: 'Require a non-empty title element inside head'},
            messages: {
                [MESSAGE_IDS.EMPTY_TITLE]: 'Unexpected empty text in `<title><title/>`',
                [MESSAGE_IDS.MISSING_TITLE]:
                    'Missing `<title><title/>` in the `<head><head/>`',
            },
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
