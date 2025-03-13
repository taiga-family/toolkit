import type {Rule} from 'eslint';

const config: Rule.RuleModule = {
    create(context) {
        const ORDER = context.options[0] || {};

        return {
            ClassDeclaration(node) {
                const decorators: any[] = Array.from((node as any).decorators ?? []);

                decorators.forEach((decorator) => {
                    const {expression} = decorator;
                    const decoratorName = expression.callee?.name ?? '';

                    if (decoratorName in (ORDER || {})) {
                        const orderList = ORDER[decoratorName];
                        const decoratorArguments: any[] = Array.from(
                            expression.arguments ?? [],
                        );

                        for (const argument of decoratorArguments) {
                            const properties = Array.from(argument.properties ?? []);
                            const current =
                                properties
                                    .map((prop: any) => prop.key?.name)
                                    .filter(Boolean) || [];

                            const correct = getCorrectOrderRelative(orderList, current);

                            if (!isCorrectSortedAccording(correct, current)) {
                                context.report({
                                    fix: (fixer) => {
                                        const fileContent = context.sourceCode.text;
                                        const forgottenProps = current.filter(
                                            (key) => !orderList.includes(key),
                                        );

                                        const sortedDecoratorProperties = [
                                            ...correct,
                                            ...forgottenProps,
                                        ].map((key) =>
                                            properties.find(
                                                (prop: any) => prop.key.name === key,
                                            ),
                                        );

                                        const newDecoratorArgument = `{${sortedDecoratorProperties
                                            .map(({range}: any) =>
                                                fileContent.slice(...range),
                                            )
                                            .toString()}}`;

                                        return fixer.replaceTextRange(
                                            argument.range,
                                            newDecoratorArgument,
                                        );
                                    },
                                    message: `Incorrect order keys in @${decoratorName} decorator, please sort by [${correct.join(
                                        ' -> ',
                                    )}]`,
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
        schema: [
            {
                additionalProperties: true,
                description: 'Decorators names and their keys order',
                type: 'object',
            },
        ],
        type: 'problem',
    },
};

function isCorrectSortedAccording(correct: string[], current: string[]): boolean {
    return (
        JSON.stringify(correct) ===
        JSON.stringify(current.filter((item) => correct.includes(item)))
    );
}

function getCorrectOrderRelative(correct: string[], current: string[]): string[] {
    return correct.filter((item) => current.includes(item));
}

export default config;
