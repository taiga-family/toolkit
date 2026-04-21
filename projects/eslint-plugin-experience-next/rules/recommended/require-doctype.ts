import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'missing';
const DOCTYPE_REGEXP = /^\s*<!doctype html>/i;

export const rule = createRule({
    name: 'require-doctype',
    rule: {
        create(context: Rule.RuleContext) {
            const sourceText = context.sourceCode.getText();
            let reported = false;

            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (
                        reported ||
                        node.name !== 'html' ||
                        DOCTYPE_REGEXP.test(sourceText)
                    ) {
                        return;
                    }

                    reported = true;

                    context.report({
                        fix: (fixer) =>
                            fixer.insertTextBeforeRange([0, 0], '<!DOCTYPE html>\n'),
                        loc: sourceSpanToLoc(node.startSourceSpan),
                        messageId: MESSAGE_ID,
                    });
                },
            };
        },
        meta: {
            docs: {description: 'Require <!DOCTYPE html> in HTML documents'},
            fixable: 'code',
            messages: {[MESSAGE_ID]: 'Missing `<!DOCTYPE html>`'},
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
