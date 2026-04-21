import {
    ASTWithSource,
    LiteralPrimitive,
    type TmplAstBoundAttribute,
    type TmplAstElement,
    type TmplAstTextAttribute,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'restricted';
const DEFAULT_MESSAGE = "'{{value}}' is restricted from being used.";

interface RestrictedAttributeValuesOption {
    readonly attrPatterns: readonly string[];
    readonly attrValuePatterns: readonly string[];
    readonly message?: string;
}

class PatternChecker {
    private readonly attrRegExps: readonly RegExp[];
    private readonly valueRegExps: readonly RegExp[];

    constructor(private readonly option: RestrictedAttributeValuesOption) {
        this.attrRegExps = option.attrPatterns.map((pattern) => new RegExp(pattern, 'u'));
        this.valueRegExps = option.attrValuePatterns.map(
            (pattern) => new RegExp(pattern, 'u'),
        );
    }

    public get message(): string | undefined {
        return this.option.message;
    }

    public test(attrName: string, attrValue: string): boolean {
        return (
            this.attrRegExps.some((exp) => exp.test(attrName)) &&
            this.valueRegExps.some((exp) => exp.test(attrValue))
        );
    }
}

function getLiteralStringValue(attr: TmplAstBoundAttribute): string | null {
    const literalValue =
        attr.value instanceof ASTWithSource ? attr.value.ast : attr.value;

    if (!(literalValue instanceof LiteralPrimitive)) {
        return null;
    }

    return typeof literalValue.value === 'string' ? literalValue.value : null;
}

function checkAttribute(
    context: Rule.RuleContext,
    attr: TmplAstBoundAttribute | TmplAstTextAttribute,
    attrValue: string,
    checkers: readonly PatternChecker[],
): void {
    const matchedChecker = checkers.find((checker) => checker.test(attr.name, attrValue));

    if (!matchedChecker) {
        return;
    }

    if (matchedChecker.message) {
        context.report({
            loc: sourceSpanToLoc(attr.sourceSpan),
            message: matchedChecker.message,
        });

        return;
    }

    context.report({
        data: {value: attrValue},
        loc: sourceSpanToLoc(attr.sourceSpan),
        messageId: MESSAGE_ID,
    });
}

const config: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        const checkers = context.options.map(
            (option) => new PatternChecker(option as RestrictedAttributeValuesOption),
        );

        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;

                for (const attr of node.attributes) {
                    checkAttribute(context, attr, attr.value, checkers);
                }

                for (const attr of node.inputs) {
                    const attrValue = getLiteralStringValue(attr);

                    if (attrValue !== null) {
                        checkAttribute(context, attr, attrValue, checkers);
                    }
                }
            },
        };
    },
    meta: {
        docs: {description: 'Disallow configured attribute values in Angular templates'},
        messages: {[MESSAGE_ID]: DEFAULT_MESSAGE},
        schema: {
            items: {
                additionalProperties: false,
                properties: {
                    attrPatterns: {
                        items: {type: 'string'},
                        type: 'array',
                    },
                    attrValuePatterns: {
                        items: {type: 'string'},
                        type: 'array',
                    },
                    message: {type: 'string'},
                },
                required: ['attrPatterns', 'attrValuePatterns'],
                type: 'object',
            },
            type: 'array',
        },
        type: 'problem',
    },
};

export const rule = createRule({
    name: 'no-restricted-attr-values',
    rule: config,
});

export default rule;
