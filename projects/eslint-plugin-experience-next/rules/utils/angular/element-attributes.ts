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

export type ElementAttributeName = string | readonly string[];

function getAttributeNames(name: ElementAttributeName): readonly string[] {
    return typeof name === 'string'
        ? [name.toLowerCase()]
        : name.map((item) => item.toLowerCase());
}

function isMatchingAttributeName(name: string, names: readonly string[]): boolean {
    return names.includes(name.toLowerCase());
}

export function getAttributeValueSpan(
    attr: ElementAttributeLike,
): ParseSourceSpan | undefined {
    return attr instanceof TmplAstBoundEvent ? attr.handlerSpan : attr.valueSpan;
}

export function getStaticAttribute(
    element: TmplAstElement,
    name: string,
): TmplAstTextAttribute | undefined {
    const attrName = name.toLowerCase();

    return element.attributes.find((attr) => attr.name.toLowerCase() === attrName);
}

export function getStaticAttributeValue(
    element: TmplAstElement,
    name: string,
): string | undefined {
    return getStaticAttribute(element, name)?.value;
}

export function hasInputBinding(
    element: TmplAstElement,
    name: ElementAttributeName,
): boolean {
    const names = getAttributeNames(name);

    return element.inputs.some((input) => isMatchingAttributeName(input.name, names));
}

export function hasAttributeBinding(
    element: TmplAstElement,
    name: ElementAttributeName,
): boolean {
    const names = getAttributeNames(name);

    return element.inputs.some((input) => {
        const details = input.keySpan.details?.toLowerCase();

        return details?.startsWith('attr.') === true && names.includes(details.slice(5));
    });
}

export function hasElementAttribute(
    element: TmplAstElement,
    name: ElementAttributeName,
): boolean {
    const names = getAttributeNames(name);

    return (
        element.attributes.some((attr) => isMatchingAttributeName(attr.name, names)) ||
        element.inputs.some((input) => {
            if (isMatchingAttributeName(input.name, names)) {
                return true;
            }

            const details = input.keySpan.details?.toLowerCase();

            return (
                details?.startsWith('attr.') === true && names.includes(details.slice(5))
            );
        })
    );
}

export function hasOutputBinding(
    element: TmplAstElement,
    name?: ElementAttributeName,
): boolean {
    if (name === undefined) {
        return element.outputs.length > 0;
    }

    const names = getAttributeNames(name);

    return element.outputs.some((output) => isMatchingAttributeName(output.name, names));
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
