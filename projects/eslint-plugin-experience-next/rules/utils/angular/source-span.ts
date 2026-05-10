import {
    type AbsoluteSourceSpan,
    type ParseSourceSpan,
} from '@angular-eslint/bundled-angular-compiler';
import {type SourceLocation} from 'estree';

export function sourceSpanToLoc(span: ParseSourceSpan): SourceLocation {
    return {
        end: {
            column: span.end.col,
            line: span.end.line + 1,
        },
        start: {
            column: span.start.col,
            line: span.start.line + 1,
        },
    };
}

export function containsAbsoluteSourceSpan(
    container: AbsoluteSourceSpan,
    child: AbsoluteSourceSpan,
): boolean {
    return container.start <= child.start && child.end <= container.end;
}

export function getAbsoluteSourceSpanText(
    text: string,
    span: AbsoluteSourceSpan,
): string {
    return text.slice(span.start, span.end);
}
