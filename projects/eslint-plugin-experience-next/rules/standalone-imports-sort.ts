import {type TSESTree} from '@typescript-eslint/types';
import {type JSSyntaxElement, type Rule} from 'eslint';

const NG_DECORATORS = ['Component', 'Directive', 'NgModule', 'Pipe'];

const config: Rule.RuleModule = {
    create(context) {
        return {
            ClassDeclaration(declaration) {
                const node = declaration as Partial<TSESTree.ClassDeclaration>;
                const decorators = Array.from(node.decorators ?? []);

                decorators.forEach((decorator) => {
                    const expression = decorator.expression as any;
                    const name = expression?.callee?.name ?? '';

                    if (!NG_DECORATORS.includes(name)) {
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
        type: 'problem',
    },
};

export default config;
