import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {getElementAttributeLikes} from './utils/angular/element-attributes';
import {sourceSpanToLoc} from './utils/angular/source-span';

const MESSAGE_IDS = {
    CLOSE_STYLE_WRONG: 'closeStyleWrong',
    NEWLINE_MISSING: 'newlineMissing',
} as const;

function buildMultilineStartTag(node: TmplAstElement, sourceText: string): string | null {
    const attrs = getElementAttributeLikes(node);

    if (attrs.length <= 2) {
        return null;
    }

    const firstAttr = attrs[0];
    const startTag = node.startSourceSpan;

    if (!firstAttr) {
        return null;
    }

    const tagStart = sourceText.slice(
        startTag.start.offset,
        firstAttr.sourceSpan.start.offset,
    );
    const lastAttr = attrs[attrs.length - 1];
    const closing = sourceText
        .slice(
            lastAttr ? lastAttr.sourceSpan.end.offset : startTag.end.offset,
            startTag.end.offset,
        )
        .trimStart();

    return [
        tagStart.trimEnd(),
        ...attrs.map((attr) =>
            sourceText
                .slice(attr.sourceSpan.start.offset, attr.sourceSpan.end.offset)
                .trim(),
        ),
        closing,
    ].join('\n');
}

export const rule: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        const sourceText = context.sourceCode.getText();

        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;
                const attrs = getElementAttributeLikes(node);

                if (attrs.length <= 2) {
                    return;
                }

                const replacement = buildMultilineStartTag(node, sourceText);

                if (!replacement) {
                    return;
                }

                const fix = (fixer: Rule.RuleFixer): Rule.Fix =>
                    fixer.replaceTextRange(
                        [
                            node.startSourceSpan.start.offset,
                            node.startSourceSpan.end.offset,
                        ],
                        replacement,
                    );
                const firstAttr = attrs[0];

                if (!firstAttr) {
                    return;
                }

                if (firstAttr.sourceSpan.start.line === node.startSourceSpan.start.line) {
                    context.report({
                        data: {attrName: firstAttr.name},
                        fix,
                        loc: sourceSpanToLoc(firstAttr.sourceSpan),
                        messageId: MESSAGE_IDS.NEWLINE_MISSING,
                    });

                    return;
                }

                for (const [index, attr] of attrs.entries()) {
                    if (index === 0) {
                        continue;
                    }

                    const previousAttr = attrs[index - 1];

                    if (!previousAttr) {
                        continue;
                    }

                    if (previousAttr.sourceSpan.end.line === attr.sourceSpan.start.line) {
                        context.report({
                            data: {attrName: attr.name},
                            fix,
                            loc: sourceSpanToLoc(attr.sourceSpan),
                            messageId: MESSAGE_IDS.NEWLINE_MISSING,
                        });

                        return;
                    }
                }

                const lastAttr = attrs[attrs.length - 1];
                const closeStyleActual =
                    lastAttr?.sourceSpan.end.line === node.startSourceSpan.end.line
                        ? 'sameline'
                        : 'newline';

                if (closeStyleActual === 'sameline') {
                    context.report({
                        data: {
                            actual: closeStyleActual,
                            expected: 'newline',
                        },
                        fix,
                        loc: sourceSpanToLoc(node.startSourceSpan),
                        messageId: MESSAGE_IDS.CLOSE_STYLE_WRONG,
                    });
                }
            },
        };
    },
    meta: {
        docs: {description: 'Enforce newline-separated attributes for multiline tags'},
        fixable: 'code',
        messages: {
            [MESSAGE_IDS.CLOSE_STYLE_WRONG]:
                'Closing bracket was on {{actual}}; expected {{expected}}',
            [MESSAGE_IDS.NEWLINE_MISSING]: 'Newline expected before {{attrName}}',
        },
        schema: [],
        type: 'layout',
    },
};

export default rule;
