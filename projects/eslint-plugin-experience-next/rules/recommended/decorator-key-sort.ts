import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getDecoratorMetadataWithName} from '../utils/angular/get-decorator-metadata';
import {getObjectPropertyName} from '../utils/ast/property-names';
import {sameOrder} from '../utils/collections/same-order';
import {createRule} from '../utils/create-rule';

type Options = [Record<string, readonly string[]>];

type MessageIds = 'incorrectOrder';

interface DecoratorProperty {
    readonly name: string;
    readonly node: TSESTree.Property;
}

export const rule = createRule<Options, MessageIds>({
    create(context, [order]) {
        const decorators = new Set(Object.keys(order));

        return {
            ClassDeclaration(node?: TSESTree.ClassDeclaration) {
                for (const decorator of node?.decorators ?? []) {
                    const metadata = getDecoratorMetadataWithName(decorator, decorators);

                    if (!metadata) {
                        continue;
                    }

                    const orderList = order[metadata.name] ?? [];
                    const properties = getDecoratorProperties(metadata.metadata);

                    if (!properties) {
                        continue;
                    }

                    const current = properties.map(({name}) => name);
                    const correct = getCorrectOrderRelative(orderList, current);

                    const sortableCurrent = current.filter((item) =>
                        correct.includes(item),
                    );

                    if (sameOrder(correct, sortableCurrent)) {
                        continue;
                    }

                    context.report({
                        data: {
                            decorator: metadata.name,
                            order: correct.join(' -> '),
                        },
                        fix: (fixer) => {
                            const forgottenProps = properties.filter(
                                ({name}) => !orderList.includes(name),
                            );

                            const sortedDecoratorProperties = [
                                ...correct.flatMap((key) =>
                                    properties.filter(({name}) => name === key),
                                ),
                                ...forgottenProps,
                            ];

                            const newDecoratorArgument = `{${sortedDecoratorProperties
                                .map(({node}) =>
                                    context.sourceCode.text.slice(...node.range),
                                )
                                .join(',')}}`;

                            return fixer.replaceTextRange(
                                metadata.metadata.range,
                                newDecoratorArgument,
                            );
                        },
                        messageId: 'incorrectOrder',
                        node: metadata.expression,
                    });
                }
            },
        };
    },
    meta: {
        defaultOptions: [{}],
        docs: {description: 'Sorts keys of Angular decorator metadata.'},
        fixable: 'code',
        messages: {
            incorrectOrder:
                'Incorrect order keys in @{{decorator}} decorator, please sort by [{{order}}]',
        },
        schema: [
            {
                additionalProperties: true,
                description: 'Decorators names and their keys order',
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'decorator-key-sort',
});

function getCorrectOrderRelative(
    correct: readonly string[],
    current: readonly string[],
): string[] {
    return correct.filter((item) => current.includes(item));
}

function getDecoratorProperties(
    metadata: TSESTree.ObjectExpression,
): DecoratorProperty[] | null {
    const properties: DecoratorProperty[] = [];

    for (const property of metadata.properties) {
        if (property.type !== AST_NODE_TYPES.Property) {
            return null;
        }

        const name = getObjectPropertyName(property);

        if (!name) {
            return null;
        }

        properties.push({name, node: property});
    }

    return properties;
}

export default rule;
