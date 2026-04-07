import {
    type TmplAstElement,
    TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';
import {type Rule} from 'eslint';

const MESSAGE_ID = 'no-project-as-in-ng-template';
const ERROR_MESSAGE =
    'ngProjectAs has no effect here. Content instantiated dynamically via ngTemplateOutlet, ngComponentOutlet, or polymorpheusOutlet does not participate in Angular static content projection.';

const DYNAMIC_OUTLET_DIRECTIVES = new Set([
    'ngComponentOutlet',
    'ngTemplateOutlet',
    'polymorpheusOutlet',
]);

interface AnyTmplAstNode {
    parent?: AnyTmplAstNode;
}

function isDynamicOutletTemplate(template: TmplAstTemplate): boolean {
    return (
        template.tagName === 'ng-template' ||
        template.templateAttrs.some((attr) => DYNAMIC_OUTLET_DIRECTIVES.has(attr.name))
    );
}

function isInsideDynamicOutlet(node: TmplAstElement): boolean {
    let parent = (node as unknown as AnyTmplAstNode).parent;

    while (parent) {
        if (parent instanceof TmplAstTemplate && isDynamicOutletTemplate(parent)) {
            return true;
        }

        parent = parent.parent;
    }

    return false;
}

const config: Rule.RuleModule = {
    create(context: Rule.RuleContext) {
        return {
            Element(rawNode: unknown) {
                const node = rawNode as TmplAstElement;
                const ngProjectAsAttr =
                    node.attributes.find((attr) => attr.name === 'ngProjectAs') ??
                    node.inputs.find((input) => input.name === 'ngProjectAs');

                if (!ngProjectAsAttr || !isInsideDynamicOutlet(node)) {
                    return;
                }

                const span = ngProjectAsAttr.sourceSpan;

                context.report({
                    loc: {
                        end: {column: span.end.col, line: span.end.line + 1},
                        start: {column: span.start.col, line: span.start.line + 1},
                    },
                    messageId: MESSAGE_ID,
                });
            },
        };
    },
    meta: {
        docs: {description: ERROR_MESSAGE},
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [],
        type: 'problem',
    },
};

export default config;
