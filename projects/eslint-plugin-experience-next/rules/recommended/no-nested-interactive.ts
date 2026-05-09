import {type TmplAstElement} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {isInteractiveElement} from '../utils/angular/interactive-elements';
import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'noNestedInteractive';

function getAvailableLabelParent(
    stack: readonly TmplAstElement[],
    node: TmplAstElement,
    labelsWithControl: WeakSet<TmplAstElement>,
): TmplAstElement | null {
    const parent = stack[stack.length - 1];

    return stack.length === 1 &&
        parent?.name.toLowerCase() === 'label' &&
        node.name.toLowerCase() !== 'label' &&
        !labelsWithControl.has(parent)
        ? parent
        : null;
}

export const rule = createRule({
    name: 'no-nested-interactive',
    rule: {
        create(context: Rule.RuleContext) {
            const interactiveStack: TmplAstElement[] = [];
            const labelsWithControl = new WeakSet<TmplAstElement>();

            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (!isInteractiveElement(node)) {
                        return;
                    }

                    const parent = interactiveStack[interactiveStack.length - 1];

                    const availableLabelParent = getAvailableLabelParent(
                        interactiveStack,
                        node,
                        labelsWithControl,
                    );

                    if (availableLabelParent) {
                        labelsWithControl.add(availableLabelParent);
                    } else if (parent) {
                        context.report({
                            data: {tag: parent.name},
                            loc: sourceSpanToLoc(node.startSourceSpan),
                            messageId: MESSAGE_ID,
                        });
                    }

                    interactiveStack.push(node);
                },
                'Element:exit'(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (interactiveStack[interactiveStack.length - 1] === node) {
                        interactiveStack.pop();
                    }
                },
            };
        },
        meta: {
            docs: {description: 'Disallow nested interactive elements'},
            messages: {
                [MESSAGE_ID]:
                    'Unexpected interactive element nested inside interactive <{{tag}}>.',
            },
            schema: [],
            type: 'problem',
        },
    },
});

export default rule;
