import {
    type TmplAstElement,
    type TmplAstTextAttribute,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';

const MESSAGE_ID = 'duplicateTag';

function findAttr(
    node: TmplAstElement,
    attrName: string,
): TmplAstTextAttribute | undefined {
    return node.attributes.find((attr) => attr.name === attrName);
}

function getTrackingKey(node: TmplAstElement): string | null {
    if (node.name === 'title' || node.name === 'base') {
        return node.name;
    }

    if (node.name === 'meta') {
        if (findAttr(node, 'charset')) {
            return 'meta[charset]';
        }

        if (findAttr(node, 'name')?.value === 'viewport') {
            return 'meta[name=viewport]';
        }
    }

    if (
        node.name === 'link' &&
        findAttr(node, 'rel')?.value === 'canonical' &&
        findAttr(node, 'href')
    ) {
        return 'link[rel=canonical]';
    }

    return null;
}

export const rule: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        const nodes = new Map<string, TmplAstElement[]>();
        let headDepth = 0;

        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;

                if (node.name === 'head') {
                    headDepth++;

                    return;
                }

                if (headDepth === 0) {
                    return;
                }

                const trackingKey = getTrackingKey(node);

                if (!trackingKey) {
                    return;
                }

                nodes.set(trackingKey, [...(nodes.get(trackingKey) ?? []), node]);
            },
            'Element:exit'(rawNode: unknown) {
                const node = rawNode as TmplAstElement;

                if (node.name === 'head') {
                    headDepth--;
                }
            },
            'Program:exit'() {
                for (const [tag, duplicates] of nodes) {
                    if (duplicates.length <= 1) {
                        continue;
                    }

                    for (const duplicate of duplicates.slice(1)) {
                        context.report({
                            data: {tag},
                            loc: sourceSpanToLoc(duplicate.startSourceSpan),
                            messageId: MESSAGE_ID,
                        });
                    }
                }
            },
        };
    },
    meta: {
        docs: {description: 'Disallow duplicate title/base/meta/link tags inside head'},
        messages: {[MESSAGE_ID]: 'Duplicate <{{tag}}> tag in <head>.'},
        schema: [],
        type: 'problem',
    },
};

export default rule;
