import fs from 'node:fs';
import path from 'node:path';

import {type RuleTextEdit} from '@eslint/core';
import {type Rule} from 'eslint';
import {type ImportDeclaration} from 'estree';
import {globSync} from 'glob';

const MESSAGE_ID = 'prefer-deep-imports';
const ERROR_MESSAGE = 'Import via root level entry point are prohibited for this package';

const config: Rule.RuleModule = {
    create(context) {
        const {importFilter} = context.options[0] || {};

        return {
            [`ImportDeclaration[source.value=${getFilterRegExp(importFilter)}]`](
                importDeclaration: ImportDeclaration,
            ) {
                const importedEntities = importDeclaration.specifiers;
                const packageName = importDeclaration.source.value;

                context.report({
                    fix(fixer): RuleTextEdit | null {
                        const allTsFiles = globSync(
                            `node_modules/${packageName}/**/*.ts`,
                            {
                                ignore: {
                                    ignored: (p) => /\.(spec|cy).ts$/.test(p.name),
                                },
                            },
                        );

                        const importedEntitiesSourceFiles = importedEntities.map(
                            ({imported}: any) =>
                                allTsFiles
                                    .find((filePath: string) => {
                                        const fileContent = fs.readFileSync(
                                            filePath,
                                            'utf8',
                                        );
                                        // Support patterns:
                                        // export class|interface|enum|const|function Name
                                        // export abstract class Name
                                        // export default class Name
                                        // export { Name } / export {Name as Alias}
                                        const directPattern = new RegExp(
                                            `(?<=export\\s+(?:default\\s+)?(?:abstract\\s+)?(?:class|interface|enum|const|let|var|function|type)\\s+)${imported.name}(?=\n|\r|\s|<|\{|\(|:)`,
                                        );
                                        const namedExportPattern = new RegExp(
                                            `export\\s*\\{[^}]*\\b${imported.name}\\b[^}]*}`,
                                        );

                                        return (
                                            directPattern.test(fileContent) ||
                                            namedExportPattern.test(fileContent)
                                        );
                                    })
                                    ?.replaceAll(/\\+/g, '/'), // Normalize Windows path to POSIX
                        );
                        const entryPoints =
                            importedEntitiesSourceFiles.map(findNearestEntryPoint);

                        if (entryPoints.some((e: string) => !e)) {
                            return null; // to prevent `import {A,B,C} from 'undefined';`
                        }

                        const isTypeOnly =
                            (importDeclaration as any)?.importKind === 'type';
                        const newImports = importedEntities.map(
                            ({imported, local}: any, i) => {
                                const importedEntity =
                                    imported.name === local.name
                                        ? imported.name
                                        : `${imported.name} as ${local.name}`;

                                return `import ${isTypeOnly ? 'type ' : ''}{${importedEntity}} from '${entryPoints[i]}';`;
                            },
                        );

                        if (!importDeclaration.range) {
                            return null;
                        }

                        return fixer.replaceTextRange(
                            importDeclaration.range,
                            newImports.join('\n'),
                        );
                    },
                    messageId: MESSAGE_ID,
                    node: importDeclaration,
                });
            },
        };
    },
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {
            [MESSAGE_ID]: ERROR_MESSAGE,
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    // i.e. "/^@taiga-ui\\u002F(core|cdk|kit)$/"
                    importFilter: {
                        description:
                            'RegExp string to detect import declarations for which this rule should be applied',
                        type: ['string', 'array'],
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
};

function findNearestEntryPoint(filePath?: string): string {
    const normalized = toPosix(filePath ?? '');

    if (!normalized) {
        return '';
    }

    const pathSegments = normalized.split('/');

    for (let i = pathSegments.length; i > 0; i--) {
        const possibleEntryPoint = pathSegments.slice(0, i).join('/');
        const ngPackageJson = path.join(
            toSystemPath(possibleEntryPoint),
            'ng-package.json',
        );

        if (fs.existsSync(ngPackageJson)) {
            return possibleEntryPoint.replace(/^node_modules[\\/]/, '');
        }
    }

    return '';
}

function toPosix(p: string): string {
    return p.replaceAll(/\\+/g, '/');
}

function toSystemPath(p: string): string {
    return path.sep === '/' ? p : p.replaceAll('/', path.sep);
}

function getFilterRegExp(filter: any): string {
    if (typeof filter === 'string' && filter.startsWith('/')) {
        return filter;
    }

    const packages = typeof filter === 'string' ? [filter] : filter;
    const [npmScope] = packages[0]?.split('/') ?? [];
    const packageNames = packages.map((p: string) => p.split('/')[1]).filter(Boolean);

    return `/^${npmScope}\\u002F(${packageNames.join('|')})$/`;
}

export default config;
