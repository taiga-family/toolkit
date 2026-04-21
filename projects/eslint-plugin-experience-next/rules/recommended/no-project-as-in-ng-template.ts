import {
    type TmplAstElement,
    TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

import {sourceSpanToLoc} from '../utils/angular/source-span';
import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'no-project-as-in-ng-template';
const NESTED_TEMPLATE_MESSAGE_ID = 'no-nested-template-in-dynamic-outlet';

const PROJECT_AS_ERROR_MESSAGE =
    'ngProjectAs on a dynamic outlet breaks SSR hydration. Use static content projection instead.';

const NESTED_TEMPLATE_ERROR_MESSAGE =
    'Avoid nesting ng-template inside dynamic outlet containers. Move the template outside the ng-container.';

const DYNAMIC_OUTLET_DIRECTIVES = new Set([
    'ngComponentOutlet',
    'ngTemplateOutlet',
    'polymorpheusOutlet',
]);

interface AnyTmplAstNode {
    parent?: AnyTmplAstNode;
}

function isInsideDynamicOutlet(node: TmplAstElement): boolean {
    let parent = (node as unknown as AnyTmplAstNode).parent;

    while (parent) {
        const hasDynamicOutletDirective =
            parent instanceof TmplAstTemplate &&
            parent.templateAttrs.some((attr) => DYNAMIC_OUTLET_DIRECTIVES.has(attr.name));

        if (hasDynamicOutletDirective) {
            return true;
        }

        parent = parent.parent;
    }

    return false;
}

function checkProjectAsOnDynamicOutlet(
    context: Rule.RuleContext,
    node: TmplAstElement,
): void {
    const ngProjectAsAttr =
        node.attributes.find((attr) => attr.name === 'ngProjectAs') ??
        node.inputs.find((input) => input.name === 'ngProjectAs');

    if (ngProjectAsAttr && isInsideDynamicOutlet(node)) {
        context.report({
            loc: sourceSpanToLoc(ngProjectAsAttr.sourceSpan),
            messageId: MESSAGE_ID,
        });
    }
}

function checkNestedTemplateInDynamicOutlet(
    context: Rule.RuleContext,
    node: TmplAstElement,
): void {
    const hasDynamicOutletInput = node.inputs.some((input) =>
        DYNAMIC_OUTLET_DIRECTIVES.has(input.name),
    );

    if (!hasDynamicOutletInput) {
        return;
    }

    for (const child of node.children) {
        if (child instanceof TmplAstTemplate && child.tagName === 'ng-template') {
            context.report({
                loc: sourceSpanToLoc(child.sourceSpan),
                messageId: NESTED_TEMPLATE_MESSAGE_ID,
            });
        }
    }
}

const config: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;

                checkProjectAsOnDynamicOutlet(context, node);
                checkNestedTemplateInDynamicOutlet(context, node);
            },
        };
    },
    meta: {
        docs: {description: PROJECT_AS_ERROR_MESSAGE},
        messages: {
            [MESSAGE_ID]: PROJECT_AS_ERROR_MESSAGE,
            [NESTED_TEMPLATE_MESSAGE_ID]: NESTED_TEMPLATE_ERROR_MESSAGE,
        },
        schema: [],
        type: 'problem',
    },
};

export const rule = createRule({
    name: 'no-project-as-in-ng-template',
    rule: config,
});

export default rule;
