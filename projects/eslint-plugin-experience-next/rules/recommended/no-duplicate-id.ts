import {
    type TmplAstElement,
    type TmplAstTextAttribute,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'duplicateId';

export const rule = createRule({
    name: 'no-duplicate-id',
    rule: {
        create(context: Rule.RuleContext) {
            const ids = new Map<string, TmplAstTextAttribute[]>();

            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;
                    const idAttr = node.attributes.find((attr) => attr.name === 'id');

                    if (!idAttr) {
                        return;
                    }

                    ids.set(idAttr.value, [...(ids.get(idAttr.value) ?? []), idAttr]);
                },
                'Program:exit'() {
                    for (const [id, attrs] of ids) {
                        if (attrs.length <= 1) {
                            continue;
                        }

                        for (const attr of attrs) {
                            context.report({
                                data: {id},
                                loc: sourceSpanToLoc(attr.sourceSpan),
                                messageId: MESSAGE_ID,
                            });
                        }
                    }
                },
            };
        },
        meta: {
            docs: {description: 'Disallow duplicate static id attributes'},
            messages: {[MESSAGE_ID]: "The id '{{id}}' is duplicated."},
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
