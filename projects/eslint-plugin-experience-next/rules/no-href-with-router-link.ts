import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

const MESSAGE_ID = 'no-href-with-router-link';
const ERROR_MESSAGE =
    'Do not use href and routerLink attributes together on the same element';

const config: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;

                if (node.name !== 'a') {
                    return;
                }

                const hrefAttr = node.attributes.find((attr) => attr.name === 'href');
                const hasRouterLink =
                    node.attributes.some(
                        (attr) => attr.name.toLowerCase() === 'routerlink',
                    ) ||
                    node.inputs.some(
                        (input) => input.name.toLowerCase() === 'routerlink',
                    );

                if (!hrefAttr || !hasRouterLink) {
                    return;
                }

                context.report({
                    fix: (fixer) =>
                        fixer.removeRange([
                            hrefAttr.sourceSpan.start.offset,
                            hrefAttr.sourceSpan.end.offset,
                        ]),
                    loc: {
                        end: {
                            column: hrefAttr.sourceSpan.end.col,
                            line: hrefAttr.sourceSpan.end.line + 1,
                        },
                        start: {
                            column: hrefAttr.sourceSpan.start.col,
                            line: hrefAttr.sourceSpan.start.line + 1,
                        },
                    },
                    messageId: MESSAGE_ID,
                });
            },
        };
    },
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [],
        type: 'problem',
    },
};

export default config;
