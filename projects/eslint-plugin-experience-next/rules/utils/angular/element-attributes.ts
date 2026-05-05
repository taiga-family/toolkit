import {
    type ParseSourceSpan,
    type TmplAstBoundAttribute,
    TmplAstBoundEvent,
    type TmplAstElement,
    type TmplAstReference,
    type TmplAstTextAttribute,
} from '@angular-eslint/bundled-angular-compiler';

export type ElementAttributeLike =
    | TmplAstBoundAttribute
    | TmplAstBoundEvent
    | TmplAstReference
    | TmplAstTextAttribute;

export function getAttributeValueSpan(
    attr: ElementAttributeLike,
): ParseSourceSpan | undefined {
    return attr instanceof TmplAstBoundEvent ? attr.handlerSpan : attr.valueSpan;
}

export function getElementAttributeLikes(
    element: TmplAstElement,
): ElementAttributeLike[] {
    const seen = new Set<string>();

    return [
        ...element.attributes,
        ...element.inputs,
        ...element.outputs,
        ...element.references,
    ]
        .sort((a, b) => a.sourceSpan.start.offset - b.sourceSpan.start.offset)
        .filter((attr) => {
            const key = `${attr.sourceSpan.start.offset}:${attr.sourceSpan.end.offset}`;

            if (seen.has(key)) {
                return false;
            }

            seen.add(key);

            return true;
        });
}
