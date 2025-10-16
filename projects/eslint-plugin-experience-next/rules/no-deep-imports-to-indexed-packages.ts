import fs from 'node:fs';
import path from 'node:path';

import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

const createRule = ESLintUtils.RuleCreator((name) => name);

export default createRule({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const program = parserServices.program;
        const compilerHost = ts.createCompilerHost(program.getCompilerOptions(), true);

        return {
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const importPath = node.source.value as string | null;

                if (typeof importPath !== 'string' || importPath.startsWith('.')) {
                    return;
                }

                const containingFile = context.filename;
                const {resolvedModule} = ts.resolveModuleName(
                    importPath,
                    containingFile,
                    program.getCompilerOptions(),
                    compilerHost,
                );

                const resolvedPath = resolvedModule?.resolvedFileName;

                if (!resolvedPath || resolvedPath.endsWith('index.ts')) {
                    return;
                }

                const dir = path.dirname(resolvedPath);
                const baseDir = path.resolve(dir, '..');
                const indexPath = path.join(baseDir, 'index.ts');
                const ngPackagePath = path.join(baseDir, 'ng-package.json');
                const packageJsonPath = path.join(baseDir, 'package.json');
                const hasIndex = fs.existsSync(indexPath);
                const hasPackage =
                    fs.existsSync(ngPackagePath) || fs.existsSync(packageJsonPath);

                if (hasIndex && hasPackage) {
                    const relative = path.relative(baseDir, resolvedPath);
                    const shouldFix = !!(relative && !relative.startsWith('..'));

                    if (shouldFix) {
                        const parts = importPath.split('/');
                        const suggestedImport = parts.slice(0, -1).join('/');

                        context.report({
                            data: {importPath, suggestedImport},
                            messageId: 'deepImport',
                            node: node.source,
                        });
                    }
                }
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                'Disallow deep imports from packages that expose an index.ts next to ng-package.json or package.json',
        },
        messages: {
            deepImport:
                'Import "{{importPath}}" should go through the package index.ts (use "{{suggestedImport}}").',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-deep-imports-to-indexed-packages',
});
