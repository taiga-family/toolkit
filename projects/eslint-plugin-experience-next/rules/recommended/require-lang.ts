import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_IDS = {
    EMPTY: 'empty',
    MISSING: 'missing',
} as const;

export const rule = createRule({
    name: 'require-lang',
    rule: {
        create(context: Rule.RuleContext) {
            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (node.name !== 'html') {
                        return;
                    }

                    const langAttr = node.attributes.find((attr) => attr.name === 'lang');
                    const hasBoundLang = node.inputs.some(
                        (input) =>
                            input.name === 'lang' ||
                            input.keySpan.details === 'attr.lang',
                    );

                    if (!langAttr && !hasBoundLang) {
                        context.report({
                            loc: sourceSpanToLoc(node.startSourceSpan),
                            messageId: MESSAGE_IDS.MISSING,
                        });

                        return;
                    }

                    if (langAttr?.value.trim().length === 0) {
                        context.report({
                            loc: sourceSpanToLoc(langAttr.sourceSpan),
                            messageId: MESSAGE_IDS.EMPTY,
                        });
                    }
                },
            };
        },
        meta: {
            docs: {description: 'Require a non-empty lang attribute on the html element'},
            messages: {
                [MESSAGE_IDS.EMPTY]: 'Unexpected empty `lang` in in `<html>` tag.',
                [MESSAGE_IDS.MISSING]: 'Missing `lang` attribute in `<html>` tag.',
            },
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
