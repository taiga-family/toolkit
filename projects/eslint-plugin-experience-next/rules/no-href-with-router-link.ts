import {type Rule} from 'eslint';

const MESSAGE_ID = 'no-href-with-router-link';
const ERROR_MESSAGE =
    'Do not use href and routerLink attributes together on the same element';

interface HTMLAttribute {
    key: {value?: string};
    value?: {value: string};
    range?: [number, number];
}

interface HTMLTag {
    name?: string;
    attributes?: HTMLAttribute[];
    range?: [number, number];
}

const config: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            Tag(node: unknown) {
                const htmlNode = node as HTMLTag | undefined;

                if (!htmlNode?.name || htmlNode.name.toLowerCase() !== 'a') {
                    return;
                }

                let hrefAttribute: HTMLAttribute | null = null;
                let routerLinkAttribute: HTMLAttribute | null = null;
                let hasRouterLink = false;
                let hasHref = false;

                for (const attr of htmlNode.attributes || []) {
                    const attrName = attr.key.value;

                    if (attrName?.toLowerCase() === 'href') {
                        hasHref = true;
                        hrefAttribute = attr;
                    } else if (attrName?.toLowerCase() === 'routerlink') {
                        hasRouterLink = true;
                        routerLinkAttribute = attr;
                    }
                }

                if (hasHref && hasRouterLink) {
                    context.report({
                        fix: (fixer) =>
                            hrefAttribute?.range
                                ? fixer.removeRange(hrefAttribute.range)
                                : null,
                        messageId: MESSAGE_ID,
                        node: (routerLinkAttribute ||
                            hrefAttribute ||
                            htmlNode) as unknown as Rule.Node,
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
