import {
    type AST,
    TmplAstBoundAttribute,
    type TmplAstElement,
    TmplAstTemplate,
} from '@angular-eslint/bundled-angular-compiler';

import {containsAbsoluteSourceSpan} from './source-span';

export type TemplateAttributeContainer = TmplAstElement | TmplAstTemplate;

export function isBoundAttribute(node: unknown): node is TmplAstBoundAttribute {
    return node instanceof TmplAstBoundAttribute;
}

export function getBoundAttributes(
    container: TemplateAttributeContainer,
): readonly TmplAstBoundAttribute[] {
    return container instanceof TmplAstTemplate
        ? [...container.inputs, ...container.templateAttrs.filter(isBoundAttribute)]
        : container.inputs;
}

export function getContainingBoundAttribute(
    container: TemplateAttributeContainer | undefined,
    node: AST,
): TmplAstBoundAttribute | null {
    return container
        ? (getBoundAttributes(container).find((attribute) =>
              containsAbsoluteSourceSpan(attribute.value.sourceSpan, node.sourceSpan),
          ) ?? null)
        : null;
}
