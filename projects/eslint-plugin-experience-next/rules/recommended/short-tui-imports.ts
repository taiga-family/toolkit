import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getDecoratorMetadata} from '../utils/angular/get-decorator-metadata';
import {getImportsArray} from '../utils/angular/get-imports-array';
import {createRule} from '../utils/create-rule';
import {getImportedName} from '../utils/imports/get-imported-name';

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

export const MESSAGE_ID = 'replaceTuiImport';

const DEFAULT_DECORATORS = ['Component', 'Directive', 'NgModule', 'Pipe'];

const DEFAULT_EXCEPTIONS: ShortImportsException[] = [
    {from: 'TuiTextfieldOptionsDirective', to: 'TuiTextfield'},
    {from: 'TuiPreviewDialogDirective', to: 'TuiPreview'},
    {from: 'TuiAccountComponent', to: 'TuiAccountComponent'},
    {from: 'TuiIslandDirective', to: 'TuiIsland'},
    {from: 'TuiTableBarsHostComponent', to: 'TuiTableBarsHost'},
];

export const rule = createRule<Options, MessageIds>({
    create(
        context,
        [{decorators = DEFAULT_DECORATORS, exceptions = DEFAULT_EXCEPTIONS}],
    ) {
        const sourceCode = context.getSourceCode();
        const allowedDecorators = new Set(decorators);

        const importedFromTaiga: Record<
            string,
            {module: string; importedAs: string; isType: boolean}
        > = {};

        return {
            Decorator(decorator: TSESTree.Decorator) {
                const metadata = getDecoratorMetadata(decorator, allowedDecorators);

                if (!metadata) {
                    return;
                }

                const importsArray = getImportsArray(metadata);

                if (!importsArray) {
                    return;
                }

                const imports = importsArray.elements.filter(
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
                        : importedAs.replace(/(?:Component|Directive)$/, '');

                    const fullText = sourceCode.getText();
                    const regex = new RegExp(String.raw`\b${importedAs}\b`, 'g');
                    const usageCount = (fullText.match(regex) ?? []).length;
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
                const isNotTaigaImport =
                    !node.source.value.startsWith('@taiga-ui/') ||
                    node.specifiers.length === 0;

                if (isNotTaigaImport) {
                    return;
                }

                for (const spec of node.specifiers) {
                    if (spec.type !== AST_NODE_TYPES.ImportSpecifier) {
                        continue;
                    }

                    const importedClass = getImportedName(spec);

                    const matchesPattern =
                        /^Tui[A-Z].*(?:Component|Directive)$/.test(importedClass) ||
                        exceptions.some((exception) => exception.from === importedClass);

                    if (matchesPattern) {
                        importedFromTaiga[spec.local.name] = {
                            importedAs: importedClass,
                            isType:
                                spec.importKind === 'type' || node.importKind === 'type',
                            module: node.source.value,
                        };
                    }
                }
            },
        };
    },

    meta: {
        defaultOptions: [
            {
                decorators: DEFAULT_DECORATORS,
                exceptions: DEFAULT_EXCEPTIONS,
            },
        ],
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
