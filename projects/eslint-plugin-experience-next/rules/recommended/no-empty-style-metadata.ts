import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {getDecoratorMetadata} from '../utils/angular/get-decorator-metadata';
import {getObjectPropertyName} from '../utils/ast/property-names';
import {createRule} from '../utils/create-rule';

type Options = [];

type MessageIds = 'noEmptyStyleMetadata';

type Range = [number, number];

const COMPONENT_DECORATORS = new Set(['Component']);

export const rule = createRule<Options, MessageIds>({
    create(context) {
        const {sourceCode} = context;

        return {
            ClassDeclaration(node?: TSESTree.ClassDeclaration) {
                for (const decorator of node?.decorators ?? []) {
                    const metadata = getDecoratorMetadata(
                        decorator,
                        COMPONENT_DECORATORS,
                    );

                    if (!metadata) {
                        continue;
                    }

                    const emptyProperties = metadata.properties.filter(
                        (property): property is TSESTree.Property =>
                            property.type === AST_NODE_TYPES.Property &&
                            isEmptyStyleMetadata(
                                getObjectPropertyName(property),
                                property,
                                sourceCode,
                            ),
                    );

                    if (emptyProperties.length === 0) {
                        continue;
                    }

                    const [firstEmptyProperty] = emptyProperties;

                    if (!firstEmptyProperty) {
                        continue;
                    }

                    context.report({
                        fix: (fixer) => {
                            const ranges = emptyProperties.map((property) =>
                                getPropertyRemovalRange(sourceCode, property),
                            );

                            return ranges.some((range) =>
                                hasCommentsInRange(sourceCode, range),
                            )
                                ? null
                                : fixer.replaceTextRange(
                                      metadata.range,
                                      removeRanges(
                                          sourceCode.text.slice(...metadata.range),
                                          ranges.map(
                                              ([start, end]): Range => [
                                                  start - metadata.range[0],
                                                  end - metadata.range[0],
                                              ],
                                          ),
                                      ),
                                  );
                        },
                        messageId: 'noEmptyStyleMetadata',
                        node: firstEmptyProperty,
                    });
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow empty `styles`, `styleUrl`, and `styleUrls` metadata in Angular components.',
        },
        fixable: 'code',
        messages: {
            noEmptyStyleMetadata:
                'Empty style metadata should be removed from @Component decorator.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-empty-style-metadata',
});

function isEmptyStyleMetadata(
    name: string | null,
    property: TSESTree.Property,
    sourceCode: TSESLint.SourceCode,
): boolean {
    return (
        ((name === 'styles' || name === 'styleUrl') &&
            isEmptyStringExpression(property.value)) ||
        (name === 'styleUrls' &&
            property.value.type === AST_NODE_TYPES.ArrayExpression &&
            property.value.elements.length === 0 &&
            sourceCode.getText(property.value).replaceAll(/\s/g, '') === '[]')
    );
}

function isEmptyStringExpression(node: TSESTree.Property['value']): boolean {
    if (node.type === AST_NODE_TYPES.Literal) {
        return node.value === '';
    }

    if (node.type !== AST_NODE_TYPES.TemplateLiteral || node.expressions.length > 0) {
        return false;
    }

    const [quasi] = node.quasis;

    return quasi?.value.raw === '';
}

function getPropertyRemovalRange(
    sourceCode: TSESLint.SourceCode,
    property: TSESTree.Property,
): Range {
    const nextToken = sourceCode.getTokenAfter(property);

    if (nextToken?.value === ',') {
        return getRangeWithFollowingComma(sourceCode.text, property, nextToken.range);
    }

    const previousToken = sourceCode.getTokenBefore(property);

    return previousToken?.value === ','
        ? [previousToken.range[0], property.range[1]]
        : getSinglePropertyRange(sourceCode.text, property);
}

function getRangeWithFollowingComma(
    text: string,
    property: TSESTree.Property,
    commaRange: Range,
): Range {
    const lineStart = getLineStart(text, property.range[0]);
    const nextLineStart = getNextLineStart(text, commaRange[1]);

    return text.slice(lineStart, property.range[0]).trim() === '' &&
        text.slice(commaRange[1], nextLineStart).trim() === '' &&
        nextLineStart > commaRange[1]
        ? [lineStart, nextLineStart]
        : [property.range[0], commaRange[1]];
}

function getSinglePropertyRange(text: string, property: TSESTree.Property): Range {
    const lineStart = getLineStart(text, property.range[0]);
    const nextLineStart = getNextLineStart(text, property.range[1]);

    return text.slice(lineStart, property.range[0]).trim() === '' &&
        text.slice(property.range[1], nextLineStart).trim() === '' &&
        nextLineStart > property.range[1]
        ? [lineStart, nextLineStart]
        : [property.range[0], property.range[1]];
}

function getLineStart(text: string, index: number): number {
    return text.lastIndexOf('\n', index - 1) + 1;
}

function getNextLineStart(text: string, index: number): number {
    const lineEnd = text.indexOf('\n', index);

    return lineEnd === -1 ? index : lineEnd + 1;
}

function hasCommentsInRange(
    sourceCode: TSESLint.SourceCode,
    [start, end]: Range,
): boolean {
    return sourceCode
        .getAllComments()
        .some((comment) => comment.range[0] >= start && comment.range[1] <= end);
}

function removeRanges(text: string, ranges: Range[]): string {
    return mergeRanges(ranges)
        .sort((left, right) => right[0] - left[0])
        .reduce(
            (result, [start, end]) => `${result.slice(0, start)}${result.slice(end)}`,
            text,
        );
}

function mergeRanges(ranges: Range[]): Range[] {
    const sorted = [...ranges].sort((left, right) => left[0] - right[0]);
    const merged: Range[] = [];

    for (const range of sorted) {
        const last = merged[merged.length - 1];

        if (!last || range[0] > last[1]) {
            merged.push([...range]);

            continue;
        }

        last[1] = Math.max(last[1], range[1]);
    }

    return merged;
}

export default rule;
