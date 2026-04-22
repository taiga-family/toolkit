import {
    type TmplAstBoundAttribute,
    type TmplAstBoundEvent,
    type TmplAstElement,
    type TmplAstTextAttribute,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {getAttributeValueSpan} from '../utils/angular/element-attributes';
import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_IDS = {
    MISSING: 'missing',
    UNEXPECTED: 'unexpected',
} as const;

const EXPECTED_QUOTE = '"';
const SINGLE_QUOTE = "'";
const DOUBLE_QUOTE = '"';

type QuotableAttribute = TmplAstBoundAttribute | TmplAstBoundEvent | TmplAstTextAttribute;

function isQuotableAttribute(attr: unknown): attr is QuotableAttribute {
    return 'sourceSpan' in (attr as Record<string, unknown>);
}

export const rule = createRule({
    name: 'quotes',
    rule: {
        create(context: Rule.RuleContext) {
            const sourceText = context.sourceCode.getText();

            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    for (const attr of [
                        ...node.attributes,
                        ...node.inputs,
                        ...node.outputs,
                    ].filter(isQuotableAttribute)) {
                        const valueSpan = getAttributeValueSpan(attr);

                        if (!valueSpan) {
                            continue;
                        }

                        let openQuoteOffset = valueSpan.start.offset - 1;

                        while (
                            openQuoteOffset >= 0 &&
                            (sourceText[openQuoteOffset] === ' ' ||
                                sourceText[openQuoteOffset] === '\n' ||
                                sourceText[openQuoteOffset] === '\r' ||
                                sourceText[openQuoteOffset] === '\t')
                        ) {
                            openQuoteOffset--;
                        }

                        const openingQuote = sourceText[openQuoteOffset];
                        const isQuotedAttribute =
                            openingQuote === SINGLE_QUOTE ||
                            openingQuote === DOUBLE_QUOTE;

                        let closeQuoteOffset = valueSpan.end.offset;

                        if (isQuotedAttribute) {
                            while (
                                closeQuoteOffset < sourceText.length &&
                                (sourceText[closeQuoteOffset] === ' ' ||
                                    sourceText[closeQuoteOffset] === '\n' ||
                                    sourceText[closeQuoteOffset] === '\r' ||
                                    sourceText[closeQuoteOffset] === '\t')
                            ) {
                                closeQuoteOffset++;
                            }
                        }

                        const closingQuote = sourceText[closeQuoteOffset];
                        const hasMatchingQuotes =
                            isQuotedAttribute && openingQuote === closingQuote;

                        const rawValue = hasMatchingQuotes
                            ? sourceText.slice(openQuoteOffset + 1, closeQuoteOffset)
                            : sourceText.slice(
                                  valueSpan.start.offset,
                                  valueSpan.end.offset,
                              );

                        if (rawValue.includes(EXPECTED_QUOTE)) {
                            continue;
                        }

                        if (hasMatchingQuotes && openingQuote !== EXPECTED_QUOTE) {
                            context.report({
                                data: {
                                    actual: `single(${openingQuote})`,
                                    expected: `double(${EXPECTED_QUOTE})`,
                                },
                                fix: (fixer) =>
                                    fixer.replaceTextRange(
                                        [openQuoteOffset, closeQuoteOffset + 1],
                                        `${EXPECTED_QUOTE}${rawValue}${EXPECTED_QUOTE}`,
                                    ),
                                loc: sourceSpanToLoc(attr.sourceSpan),
                                messageId: MESSAGE_IDS.UNEXPECTED,
                            });

                            continue;
                        }

                        if (!hasMatchingQuotes) {
                            context.report({
                                data: {expected: `double(${EXPECTED_QUOTE})`},
                                fix: (fixer) =>
                                    fixer.replaceTextRange(
                                        [valueSpan.start.offset, valueSpan.end.offset],
                                        `${EXPECTED_QUOTE}${rawValue}${EXPECTED_QUOTE}`,
                                    ),
                                loc: sourceSpanToLoc(attr.sourceSpan),
                                messageId: MESSAGE_IDS.MISSING,
                            });
                        }
                    }
                },
            };
        },
        meta: {
            docs: {description: 'Enforce double quotes around HTML attribute values'},
            fixable: 'code',
            messages: {
                [MESSAGE_IDS.MISSING]:
                    'Expected {{expected}} quotes but no quotes found.',
                [MESSAGE_IDS.UNEXPECTED]:
                    'Expected {{expected}} quotes but found {{actual}}.',
            },
            schema: [],
            type: 'layout',
        },
    },
});

export default rule;
