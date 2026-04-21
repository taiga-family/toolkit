import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';
import {createRule} from './utils/create-rule';

const MESSAGE_IDS = {
    EMPTY_TITLE: 'empty',
    MISSING_TITLE: 'missing',
} as const;

function hasMeaningfulTitleContent(node: TmplAstElement): boolean {
    return node.children.some((child) => {
        if (!('value' in child)) {
            return false;
        }

        const {value} = child as Record<'value', unknown>;

        return (
            typeof value === 'object' ||
            (typeof value === 'string' && value.trim().length > 0)
        );
    });
}

export const rule = createRule({
    name: 'require-title',
    rule: {
        create(context: Rule.RuleContext) {
            let headNode: TmplAstElement | undefined;
            let headDepth = 0;
            let titleNode: TmplAstElement | undefined;

            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (node.name === 'head') {
                        headNode = node;
                        headDepth++;
                    } else if (headDepth > 0 && node.name === 'title') {
                        titleNode = node;
                    }
                },
                'Element:exit'(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (node.name === 'head') {
                        headDepth--;
                    }
                },
                'Program:exit'() {
                    if (!headNode) {
                        return;
                    }

                    if (!titleNode) {
                        context.report({
                            loc: sourceSpanToLoc(headNode.startSourceSpan),
                            messageId: MESSAGE_IDS.MISSING_TITLE,
                        });

                        return;
                    }

                    if (!hasMeaningfulTitleContent(titleNode)) {
                        context.report({
                            loc: sourceSpanToLoc(titleNode.startSourceSpan),
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
