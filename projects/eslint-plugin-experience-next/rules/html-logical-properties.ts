import {type TmplAstBoundAttribute} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

const DIRECTIONAL_TO_LOGICAL: Record<string, string> = {
    'border-bottom': 'border-block-end',
    'border-left': 'border-inline-start',
    'border-right': 'border-inline-end',
    'border-top': 'border-block-start',
    bottom: 'inset-block-end',
    left: 'inset-inline-start',
    'margin-bottom': 'margin-block-end',
    'margin-left': 'margin-inline-start',
    'margin-right': 'margin-inline-end',
    'margin-top': 'margin-block-start',
    'padding-bottom': 'padding-block-end',
    'padding-left': 'padding-inline-start',
    'padding-right': 'padding-inline-end',
    'padding-top': 'padding-block-start',
    right: 'inset-inline-end',
    top: 'inset-block-start',
};

const STYLE_PREFIX = 'style.';
const MESSAGE_ID = 'html-logical-properties';

const MESSAGE = `
Use logical CSS properties instead of directional properties. Replace:
• left → inset-inline-start
• right → inset-inline-end
• top → inset-block-start
• bottom → inset-block-end
• margin-left → margin-inline-start
• margin-right → margin-inline-end
• margin-top → margin-block-start
• margin-bottom → margin-block-end
• padding-left → padding-inline-start
• padding-right → padding-inline-end
• padding-top → padding-block-start
• padding-bottom → padding-block-end
• border-left → border-inline-start
• border-right → border-inline-end
• border-top → border-block-start
• border-bottom → border-block-end
`;

const config: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            BoundAttribute(rawNode: unknown) {
                const node = rawNode as TmplAstBoundAttribute;

                if (!node.keySpan.details?.startsWith(STYLE_PREFIX)) {
                    return;
                }

                const logicalProperty = DIRECTIONAL_TO_LOGICAL[node.name];

                if (!logicalProperty) {
                    return;
                }

                const {keySpan} = node;
                const propertyStart = keySpan.start.offset + STYLE_PREFIX.length;
                const propertyEnd = propertyStart + node.name.length;

                context.report({
                    fix: (fixer) =>
                        fixer.replaceTextRange(
                            [propertyStart, propertyEnd],
                            logicalProperty,
                        ),
                    loc: {
                        end: {
                            column: keySpan.end.col,
                            line: keySpan.end.line + 1,
                        },
                        start: {
                            column: keySpan.start.col,
                            line: keySpan.start.line + 1,
                        },
                    },
                    messageId: MESSAGE_ID,
                });
            },
        };
    },
    meta: {
        docs: {description: MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: MESSAGE},
        schema: [],
        type: 'suggestion',
    },
};

export default config;
