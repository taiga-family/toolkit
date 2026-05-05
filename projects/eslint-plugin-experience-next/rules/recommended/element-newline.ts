import {
    TmplAstBoundText,
    TmplAstElement,
    TmplAstText,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';
import {INLINE_HTML_ELEMENTS} from '../utils/html/inline-elements';

const MESSAGE_ID = 'expectAfter';
const SKIP_CHILDREN = new Set(['code', 'pre']);

type ChildNode = TmplAstBoundText | TmplAstElement | TmplAstText;

function isChildNode(node: unknown): node is ChildNode {
    return (
        node instanceof TmplAstBoundText ||
        node instanceof TmplAstElement ||
        node instanceof TmplAstText
    );
}

function isInlineNode(node: ChildNode): boolean {
    return (
        node instanceof TmplAstText ||
        node instanceof TmplAstBoundText ||
        (node instanceof TmplAstElement && INLINE_HTML_ELEMENTS.has(node.name))
    );
}

function isMeaningfulText(node: ChildNode): boolean {
    return !(node instanceof TmplAstText) || node.value.trim().length > 0;
}

function getMeaningfulChildren(node: TmplAstElement): ChildNode[] {
    return node.children.filter(isChildNode).filter(isMeaningfulText);
}

function getNodeLabel(node: ChildNode | TmplAstElement): string {
    if (node instanceof TmplAstElement) {
        return `<${node.name}>`;
    }

    return node instanceof TmplAstBoundText ? 'binding' : 'text';
}

export const rule = createRule({
    name: 'element-newline',
    rule: {
        create(context: Rule.RuleContext) {
            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (SKIP_CHILDREN.has(node.name) || !node.endSourceSpan) {
                        return;
                    }

                    const children = getMeaningfulChildren(node);

                    if (!children.some((child) => !isInlineNode(child))) {
                        return;
                    }

                    const firstChild = children[0];

                    if (!firstChild) {
                        return;
                    }

                    if (
                        node.startSourceSpan.end.line === firstChild.sourceSpan.start.line
                    ) {
                        context.report({
                            data: {name: getNodeLabel(node)},
                            fix: (fixer) =>
                                fixer.insertTextBeforeRange(
                                    [
                                        firstChild.sourceSpan.start.offset,
                                        firstChild.sourceSpan.start.offset,
                                    ],
                                    '\n',
                                ),
                            loc: sourceSpanToLoc(firstChild.sourceSpan),
                            messageId: MESSAGE_ID,
                        });

                        return;
                    }

                    for (const [index, child] of children.entries()) {
                        const next = children[index + 1];

                        if (!next) {
                            continue;
                        }

                        if (
                            child.sourceSpan.end.line === next.sourceSpan.start.line &&
                            (!isInlineNode(child) || !isInlineNode(next))
                        ) {
                            context.report({
                                data: {name: getNodeLabel(child)},
                                fix: (fixer) =>
                                    fixer.insertTextAfterRange(
                                        [
                                            child.sourceSpan.end.offset,
                                            child.sourceSpan.end.offset,
                                        ],
                                        '\n',
                                    ),
                                loc: sourceSpanToLoc(next.sourceSpan),
                                messageId: MESSAGE_ID,
                            });

                            return;
                        }
                    }

                    const lastChild = children[children.length - 1];

                    if (
                        lastChild?.sourceSpan.end.line === node.endSourceSpan.start.line
                    ) {
                        context.report({
                            data: {name: getNodeLabel(lastChild)},
                            fix: (fixer) =>
                                fixer.insertTextAfterRange(
                                    [
                                        lastChild.sourceSpan.end.offset,
                                        lastChild.sourceSpan.end.offset,
                                    ],
                                    '\n',
                                ),
                            loc: sourceSpanToLoc(lastChild.sourceSpan),
                            messageId: MESSAGE_ID,
                        });
                    }
                },
            };
        },
        meta: {
            docs: {description: 'Enforce line breaks between block-level child nodes'},
            fixable: 'code',
            messages: {[MESSAGE_ID]: 'There should be a linebreak after {{name}}.'},
            schema: [],
            type: 'layout',
        },
    },
});

export default rule;
