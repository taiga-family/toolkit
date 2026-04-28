import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'invalid';
const VALID_CONTAINERS = new Set(['menu', 'ol', 'ul']);

/**
 * Duck-type check for TmplAstElement — avoids instanceof which breaks when
 * the plugin's bundled-angular-compiler differs from the one used by the
 * template parser (e.g. when the plugin is consumed from a different project).
 */
function isElement(node: unknown): node is TmplAstElement {
    return (
        typeof node === 'object' &&
        node != null &&
        typeof (node as Record<string, unknown>)['name'] === 'string' &&
        Array.isArray((node as Record<string, unknown>)['children'])
    );
}

function getClosestParentElement(node: TmplAstElement): TmplAstElement | null {
    let current = (node as unknown as Record<string, unknown>)['parent'];

    while (current != null) {
        if (isElement(current)) {
            return current;
        }

        current = (current as Record<string, unknown>)['parent'];
    }

    return null;
}

export const rule = createRule({
    name: 'require-li-container',
    rule: {
        create(context: Rule.RuleContext) {
            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (node.name !== 'li') {
                        return;
                    }

                    const parent = getClosestParentElement(node);

                    if (parent && VALID_CONTAINERS.has(parent.name)) {
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
            docs: {
                description: 'Require li elements to be placed inside ul, ol, or menu',
            },
            messages: {
                [MESSAGE_ID]:
                    'Invalid container of `<li>`. <li>` should be in `<ul>`, `<ol>` or `<menu>`.',
            },
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
