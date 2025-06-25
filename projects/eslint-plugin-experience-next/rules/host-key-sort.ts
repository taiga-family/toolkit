import type {Rule} from 'eslint';
import JSON5 from 'json5';

const config: Rule.RuleModule = {
    create(context) {
        return {
            ClassDeclaration(node) {
                const decorators: any[] = Array.from((node as any).decorators ?? []);

                for (const decorator of decorators) {
                    if (
                        decorator.expression.type === 'CallExpression' &&
                        decorator.expression.callee.type === 'Identifier' &&
                        decorator.expression.callee.name === 'Component'
                    ) {
                        for (const arg of decorator.expression.arguments
                            .map((arg: any) => arg.properties)
                            .filter((property: any) => property)
                            .flat()
                            .filter((property: any) => property?.key?.name === 'host')) {
                            const text = context.getSourceCode().getText(arg.value);

                            try {
                                const nonSorted = JSON5.parse(text);
                                const sorted = Object.fromEntries(
                                    Object.entries(nonSorted).sort(([a], [b]) =>
                                        a < b ? -1 : 1,
                                    ),
                                );

                                const fixable =
                                    JSON.stringify(sorted) !== JSON.stringify(nonSorted);

                                // eslint-disable-next-line max-depth
                                if (fixable) {
                                    context.report({
                                        fix: (fixer) => {
                                            return fixer.replaceTextRange(
                                                arg.range,
                                                `host: ${JSON.stringify(
                                                    sorted,
                                                    null,
                                                    2,
                                                )}\n`,
                                            );
                                        },
                                        message:
                                            'Keys in the host property of the Component decorator are not in alphabetical order.',
                                        node: arg,
                                    });
                                }
                            } catch {}
                        }
                    }
                }
            },
        };
    },
    meta: {
        fixable: 'code',
        schema: [
            {
                additionalProperties: true,
                description: 'Sorting keys in host property',
                type: 'object',
            },
        ],
        type: 'problem',
    },
};

export default config;
