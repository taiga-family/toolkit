import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from './utils/angular/source-span';
import {OBSOLETE_HTML_ATTRS} from './utils/html/obsolete-attrs';

const MESSAGE_ID = 'obsolete';

export const rule: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;
                const elementName = node.name.toLowerCase();

                for (const attr of node.attributes) {
                    if (!attr.valueSpan) {
                        continue;
                    }

                    const attrName = attr.name.toLowerCase();
                    const obsoleteConfigs = OBSOLETE_HTML_ATTRS[attrName];

                    if (!obsoleteConfigs) {
                        continue;
                    }

                    const obsoleteConfig = obsoleteConfigs.find(
                        (config) =>
                            config.elements.includes('*') ||
                            config.elements.includes(elementName),
                    );

                    if (!obsoleteConfig) {
                        continue;
                    }

                    context.report({
                        data: {
                            attr: attrName,
                            element: elementName,
                            suggestion: obsoleteConfig.suggestion,
                        },
                        loc: sourceSpanToLoc(attr.keySpan ?? attr.sourceSpan),
                        messageId: MESSAGE_ID,
                    });
                }
            },
        };
    },
    meta: {
        docs: {description: 'Disallow obsolete HTML attributes'},
        messages: {
            [MESSAGE_ID]:
                'The {{attr}} attribute on <{{element}}> is obsolete. {{suggestion}}',
        },
        schema: [],
        type: 'problem',
    },
};

export default rule;
