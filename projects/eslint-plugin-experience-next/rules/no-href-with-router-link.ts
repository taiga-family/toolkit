import {type Rule} from 'eslint';

const MESSAGE_ID = 'no-href-with-router-link';
const ERROR_MESSAGE =
    'Do not use href and routerLink attributes together on the same element';

const config: Rule.RuleModule = {
    create(context) {
        return {
            // This will match HTML Tag elements when using html parser
            Tag(node: any) {
                if (!node.name || node.name.toLowerCase() !== 'a') {
                    return;
                }

                const attributes = node.attributes || [];
                let hasHref = false;
                let hasRouterLink = false;
                let hrefAttribute;
                let routerLinkAttribute;

                for (const attr of attributes) {
                    const attrName = attr.key?.value;

                    if (attrName === 'href') {
                        hasHref = true;
                        hrefAttribute = attr;
                    } else if (attrName === 'routerLink' || attrName === 'routerlink') {
                        hasRouterLink = true;
                        routerLinkAttribute = attr;
                    }
                }

                if (hasHref && hasRouterLink) {
                    context.report({
                        fix: (fixer) => {
                            // Remove the href attribute as routerLink should take precedence
                            return fixer.remove(hrefAttribute);
                        },
                        messageId: MESSAGE_ID,
                        node: routerLinkAttribute || hrefAttribute,
                    });
                }
            },
        };
    },
    meta: {
        docs: {
            description: ERROR_MESSAGE,
        },
        fixable: 'code',
        messages: {
            [MESSAGE_ID]: ERROR_MESSAGE,
        },
        type: 'problem',
    },
};

export default config;
