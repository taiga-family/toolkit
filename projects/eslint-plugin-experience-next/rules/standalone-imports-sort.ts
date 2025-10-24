import {type TSESTree} from '@typescript-eslint/types';
import {type JSSyntaxElement, type Rule} from 'eslint';

const config: Rule.RuleModule = {
    create(context) {
        const config = context.options[0] ?? {};
        const defaultDecorators = config.decorators ?? [
            'Component',
            'Directive',
            'NgModule',
            'Pipe',
        ];

        return {
            ClassDeclaration(declaration) {
                const node = declaration as Partial<TSESTree.ClassDeclaration>;
                const decorators = Array.from(node.decorators ?? []);

                decorators.forEach((decorator) => {
                    const expression = decorator.expression as any;
                    const name = expression?.callee?.name ?? '';

                    if (!defaultDecorators.includes(name)) {
                        return;
                    }

                    const decoratorArguments = Array.from(expression.arguments ?? []);

                    for (const argument of decoratorArguments) {
                        const properties: any = Array.from(
                            (argument as any).properties ?? [],
                        ).reduce((mappings: any, item: any) => {
                            mappings[item.key.name] = item;

                            return mappings;
                        }, {});

                        if (properties.imports) {
                            const elements = properties.imports.value.elements;
                            const regularElements = [];
                            const spreadElements = [];

                            for (const element of elements) {
                                if (element.type === 'SpreadElement') {
                                    spreadElements.push(element);
                                } else {
                                    regularElements.push(element);
                                }
                            }

                            const sortedRegularElements = regularElements
                                .slice()
                                .sort((a, b) =>
                                    (a.name ?? '').localeCompare(b.name ?? ''),
                                );

                            const sortedSpreadElements = spreadElements
                                .slice()
                                .sort((a, b) =>
                                    (a.argument.name ?? '').localeCompare(
                                        b.argument.name || '',
                                    ),
                                );

                            const newOrder = [
                                ...sortedRegularElements,
                                ...sortedSpreadElements,
                            ];

                            const currentOrder = elements.map((el: any) =>
                                el.type === 'SpreadElement'
                                    ? `...${el.argument.name}`
                                    : el.name,
                            );

                            const expectedOrder = newOrder.map((el: any) =>
                                el.type === 'SpreadElement'
                                    ? `...${el.argument.name}`
                                    : el.name,
                            );

                            if (
                                JSON.stringify(currentOrder) !==
                                JSON.stringify(expectedOrder)
                            ) {
                                const source = expectedOrder
                                    .map((name) => (name === 'null' ? 'null' : name))
                                    .join(', ');

                                context.report({
                                    fix: (fixer) =>
                                        fixer.replaceTextRange(
                                            properties.imports.value.range,
                                            `[${source}]`,
                                        ),
                                    message: `Order in imports should be [${source}]`,
                                    node: expression as JSSyntaxElement,
                                });
                            }
                        }
                    }
                });
            },
        };
    },
    meta: {
        fixable: 'code',
        schema: [
            {
                additionalProperties: false,
                properties: {
                    decorators: {
                        items: {
                            type: 'string',
                        },
                        type: 'array',
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
};

export default config;
