import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';
import {createRule} from './utils/create-rule';
import {OBSOLETE_HTML_TAGS} from './utils/html/obsolete-tags';

const MESSAGE_ID = 'unexpected';

export const rule = createRule({
    name: 'no-obsolete-tags',
    rule: {
        create(context: Rule.RuleContext) {
            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (!OBSOLETE_HTML_TAGS.has(node.name)) {
                        return;
                    }

                    context.report({
                        data: {tag: node.name},
                        loc: sourceSpanToLoc(node.startSourceSpan),
                        messageId: MESSAGE_ID,
                    });
                },
            };
        },
        meta: {
            docs: {description: 'Disallow obsolete HTML tags'},
            messages: {[MESSAGE_ID]: 'Unexpected use of obsolete tag <{{tag}}>'},
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
