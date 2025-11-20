import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {getImportedName} from './utils/get-imported-name';
import {isImportsArrayProperty} from './utils/is-imports-array-property';

export interface ShortImportsException {
    from: string;
    to: string;
}

export type Options = [
    {
        decorators?: string[];
        exceptions?: ShortImportsException[];
    },
];

export type MessageIds = 'replaceTuiImport';

export const MESSAGE_ID: MessageIds = 'replaceTuiImport';

const DEFAULT_DECORATORS = ['Component', 'Directive', 'NgModule', 'Pipe'];

const DEFAULT_EXCEPTIONS: ShortImportsException[] = [
    {from: 'TuiTextfieldOptionsDirective', to: 'TuiTextfield'},
    {from: 'TuiPreviewDialogDirective', to: 'TuiPreview'},
];

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule<Options, MessageIds>({
    create(
        context,
        [{decorators = DEFAULT_DECORATORS, exceptions = DEFAULT_EXCEPTIONS}],
    ) {
        const sourceCode = context.getSourceCode();
        const importedFromTaiga: Record<
            string,
            {module: string; importedAs: string; isType: boolean}
        > = {};

        const decoratorSelector = `Decorator[expression.callee.name=/^(${decorators.join('|')})$/]`;

        return {
            [decoratorSelector](decorator: TSESTree.Decorator) {
                const expression = decorator.expression;

                const isInvalidExpression =
                    expression.type !== AST_NODE_TYPES.CallExpression ||
                    expression.arguments.length === 0;

                if (isInvalidExpression) {
                    return;
                }

                const [arg] = expression.arguments;
                const isNotObject = !arg || arg.type !== AST_NODE_TYPES.ObjectExpression;

                if (isNotObject) {
                    return;
                }

                const importsProperty = arg.properties
                    .filter(
                        (literal): literal is TSESTree.Property =>
                            literal.type === AST_NODE_TYPES.Property,
                    )
                    .find((literal) => isImportsArrayProperty(literal));

                if (!importsProperty) {
                    return;
                }

                const imports = importsProperty.value.elements.filter(
                    (el): el is TSESTree.Identifier => {
                        const isIdentifier = el?.type === AST_NODE_TYPES.Identifier;

                        return Boolean(el && isIdentifier);
                    },
                );

                for (const importName of imports) {
                    const found = importedFromTaiga[importName.name];

                    if (!found) {
                        continue;
                    }

                    const {importedAs, isType, module} = found;

                    if (isType) {
                        continue;
                    }

                    const exception = exceptions.find((ex) => ex.from === importedAs);
                    const short = exception
                        ? exception.to
                        : importedAs.replace(/(Component|Directive)$/, '');

                    const fullText = sourceCode.getText();
                    const regex = new RegExp(String.raw`\b${importedAs}\b`, 'g');
                    const usageCount = (fullText.match(regex) || []).length;
                    const shouldDeleteImport = usageCount <= 2;

                    context.report({
                        data: {newName: short, oldName: importedAs},
                        fix(fixer) {
                            const importDeclaration = sourceCode.ast.body.find(
                                (statement): statement is TSESTree.ImportDeclaration =>
                                    statement.type === AST_NODE_TYPES.ImportDeclaration &&
                                    statement.source.value === module,
                            );

                            const hasNoImports =
                                !importDeclaration ||
                                importDeclaration.specifiers.length === 0;

                            if (hasNoImports) {
                                return null;
                            }

                            const specifierNames = importDeclaration.specifiers
                                .filter(
                                    (clause): clause is TSESTree.ImportSpecifier =>
                                        clause.type === AST_NODE_TYPES.ImportSpecifier &&
                                        clause.importKind !== 'type',
                                )
                                .map((specifier) => getImportedName(specifier));

                            const nextNames = new Set(specifierNames);

                            nextNames.add(short);

                            if (shouldDeleteImport) {
                                nextNames.delete(importedAs);
                            }

                            const typeImports = importDeclaration.specifiers
                                .filter(
                                    (clause): clause is TSESTree.ImportSpecifier =>
                                        clause.type === AST_NODE_TYPES.ImportSpecifier &&
                                        (clause.importKind === 'type' ||
                                            importDeclaration.importKind === 'type'),
                                )
                                .map((specifier) => `type ${getImportedName(specifier)}`);

                            const allNames = [...typeImports, ...[...nextNames].sort()];
                            const newImport = `import { ${allNames.join(
                                ', ',
                            )} } from '${module}';`;

                            const alreadyHasShort = imports.some(
                                (id) => id.name === short,
                            );

                            if (alreadyHasShort) {
                                const currentRange = importName.range;

                                return [
                                    fixer.replaceText(importDeclaration, newImport),
                                    fixer.removeRange(currentRange),
                                ];
                            }

                            return [
                                fixer.replaceText(importDeclaration, newImport),
                                fixer.replaceText(importName, short),
                            ];
                        },
                        messageId: MESSAGE_ID,
                        node: importName,
                    });
                }
            },

            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const modulePath = node.source.value satisfies string;
                const isTopLevelTaiga =
                    modulePath.startsWith('@taiga-ui/') &&
                    modulePath.split('/').length === 2;

                if (!isTopLevelTaiga || node.specifiers.length === 0) {
                    return;
                }

                for (const spec of node.specifiers) {
                    if (spec.type !== AST_NODE_TYPES.ImportSpecifier) {
                        continue;
                    }

                    const importedClass = getImportedName(spec);

                    const matchesPattern =
                        /^Tui[A-Z].*(Component|Directive)$/.test(importedClass) ||
                        exceptions.some((exception) => exception.from === importedClass);

                    if (matchesPattern) {
                        importedFromTaiga[spec.local.name] = {
                            importedAs: importedClass,
                            isType:
                                spec.importKind === 'type' || node.importKind === 'type',
                            module: modulePath,
                        };
                    }
                }
            },
        };
    },

    defaultOptions: [
        {
            decorators: DEFAULT_DECORATORS,
            exceptions: DEFAULT_EXCEPTIONS,
        },
    ],

    meta: {
        docs: {
            description:
                'Shorten TuiXxxComponent / TuiYyyDirective in Angular metadata (supports configurable decorators and exceptions).',
        },
        fixable: 'code',
        messages: {
            replaceTuiImport:
                'Replace {{oldName}} with {{newName}} in Angular metadata (type imports preserved).',
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    decorators: {
                        items: {type: 'string'},
                        type: 'array',
                    },
                    exceptions: {
                        items: {
                            additionalProperties: false,
                            properties: {
                                from: {type: 'string'},
                                to: {type: 'string'},
                            },
                            required: ['from', 'to'],
                            type: 'object',
                        },
                        type: 'array',
                    },
                },
                type: 'object',
            },
        ],
        type: 'suggestion',
    },

    name: 'short-tui-imports',
});

export default rule;
