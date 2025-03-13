import type {Rule} from 'eslint';

const config: Rule.RuleModule = {
    create(context) {
        return {
            ClassDeclaration(node) {
                const decorators = Array.from((node as any).decorators ?? []);

                decorators.forEach((decorator: any) => {
                    const {expression} = decorator;
                    const decoratorArguments = Array.from(expression.arguments ?? []);

                    for (const argument of decoratorArguments) {
                        const properties: any = Array.from(
                            (argument as any).properties ?? [],
                        ).reduce((mappings: any, item: any) => {
                            mappings[item.key.name] = item;

                            return mappings;
                        }, {});

                        if (properties.standalone && properties.imports) {
                            const currentOrder = properties.imports.value.elements.map(
                                (prop: any) => prop.name,
                            );

                            const newOrder = currentOrder
                                .slice()
                                .sort((a: any, b: any) => a.localeCompare(b));

                            if (
                                JSON.stringify(currentOrder) !== JSON.stringify(newOrder)
                            ) {
                                const source = JSON.stringify(newOrder)
                                    .replaceAll('"', '')
                                    .replaceAll(',', ', ');

                                context.report({
                                    fix: (fixer) =>
                                        fixer.replaceTextRange(
                                            properties.imports.value.range,
                                            source,
                                        ),
                                    message: `Order in imports should be ${source}`,
                                    node: expression,
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
        type: 'problem',
    },
};

export default config;
