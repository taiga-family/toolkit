import {TmplAstElement, TmplAstTemplate} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';
import {createRule} from './utils/create-rule';

const MESSAGE_ID = 'invalid';
const VALID_CONTAINERS = new Set(['menu', 'ol', 'ul']);

interface ParentNode {
    parent?: ParentNode;
}

function getClosestParentElement(node: TmplAstElement): TmplAstElement | null {
    let parent = (node as ParentNode & TmplAstElement).parent;

    while (parent) {
        if (parent instanceof TmplAstElement) {
            return parent;
        }

        if (parent instanceof TmplAstTemplate) {
            parent = parent.parent;

            continue;
        }

        break;
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
