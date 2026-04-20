import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';

const MESSAGE_ID = 'missingAlt';

function hasAlt(node: TmplAstElement): boolean {
    return (
        node.attributes.some((attr) => attr.name === 'alt') ||
        node.inputs.some(
            (input) => input.name === 'alt' || input.keySpan.details === 'attr.alt',
        )
    );
}

export const rule: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;

                if (node.name !== 'img' || hasAlt(node)) {
                    return;
                }

                context.report({
                    loc: sourceSpanToLoc(node.startSourceSpan),
                    messageId: MESSAGE_ID,
                });
            },
        };
    },
    meta: {
        docs: {description: 'Require alt or attr.alt on img elements'},
        messages: {[MESSAGE_ID]: 'Missing `alt` attribute at `<img>` tag'},
        schema: [],
        type: 'suggestion',
    },
};

export default rule;
