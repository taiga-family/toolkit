import {type Rule} from 'eslint';

const config: Rule.RuleModule = {
    create(context) {
        const classesInFile = new Map<string, true>();

        return {
            ClassDeclaration(node) {
                if (node.id.name) {
                    classesInFile.set(node.id.name, true);
                }
            },
            ExportNamedDeclaration(node) {
                const decl = node.declaration;

                if (decl?.type === 'VariableDeclaration' && decl.kind === 'const') {
                    for (const d of decl.declarations) {
                        const init = d.init;

                        const isArrayWithClasses =
                            init?.type === 'ArrayExpression' &&
                            init.elements.length > 0 &&
                            init.elements.every(
                                (el) =>
                                    el?.type === 'Identifier' &&
                                    classesInFile.has(el.name),
                            );

                        if (isArrayWithClasses) {
                            const sourceCode = context.sourceCode;
                            const afterArrayText = sourceCode
                                .getText()
                                .slice(init.range?.[1], d.range?.[1]);

                            if (!/as\s+const/.test(afterArrayText)) {
                                context.report({
                                    fix(fixer) {
                                        return fixer.insertTextAfter(init, ' as const');
                                    },
                                    messageId: 'shouldUseAsConst',
                                    node: init,
                                });
                            }
                        }
                    }
                }
            },
            ImportDeclaration(node) {
                for (const specifier of node.specifiers) {
                    classesInFile.set(specifier.local.name, true);
                }
            },
        };
    },
    meta: {
        docs: {description: 'Exported arrays of class references should use `as const`.'},
        fixable: 'code',
        messages: {
            shouldUseAsConst:
                'Exported array of class references should be marked with `as const`.',
        },
        schema: [],
        type: 'suggestion',
    },
};

export default config;
