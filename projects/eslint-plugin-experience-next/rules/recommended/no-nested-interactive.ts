import {
    type TmplAstElement,
    type TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {isInteractiveElement} from '../utils/angular/interactive-elements';
import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'noNestedInteractive';

// Elements that act as DOM portals or isolated list containers:
// their children are rendered outside the current DOM subtree.
const PORTAL_ELEMENTS = new Set(['tui-data-list', 'tui-textfield']);

// Structural directives that portal their host element into an overlay.
const PORTAL_STRUCTURAL_DIRECTIVES = new Set(['tuiDropdown']);

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
            const savedStackByNode = new WeakMap<object, TmplAstElement[]>();

            function saveAndReset(node: object): void {
                savedStackByNode.set(node, [...interactiveStack]);
                interactiveStack.length = 0;
            }

            function restore(node: object): void {
                const saved = savedStackByNode.get(node);

                if (saved === undefined) {
                    return;
                }

                savedStackByNode.delete(node);
                interactiveStack.length = 0;
                interactiveStack.push(...saved);
            }

            return {
                Element(rawNode: unknown) {
                    const node = rawNode as TmplAstElement;

                    if (PORTAL_ELEMENTS.has(node.name.toLowerCase())) {
                        saveAndReset(node);

                        return;
                    }

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

                    restore(node);

                    if (interactiveStack[interactiveStack.length - 1] === node) {
                        interactiveStack.pop();
                    }
                },
                Template(rawNode: unknown) {
                    const node = rawNode as TmplAstTemplate;

                    const isPortalBoundary =
                        node.tagName === 'ng-template' ||
                        node.templateAttrs.some((attr) =>
                            PORTAL_STRUCTURAL_DIRECTIVES.has(attr.name),
                        );

                    if (isPortalBoundary) {
                        saveAndReset(node);
                    }
                },
                'Template:exit'(rawNode: unknown) {
                    const node = rawNode as TmplAstTemplate;

                    restore(node);
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
