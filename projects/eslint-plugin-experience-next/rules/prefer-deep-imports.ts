import fs from 'node:fs';
import path from 'node:path';

import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import {globSync} from 'glob';
import ts from 'typescript';

const MESSAGE_ID = 'prefer-deep-imports';
const ERROR_MESSAGE =
    'Import via root entry point is prohibited when nested entry points exist';

type RuleOptions = [
    {
        importFilter: string[] | string;
        strict?: boolean;
    },
];

type MessageIds = typeof MESSAGE_ID;

const createRule = ESLintUtils.RuleCreator(() => ERROR_MESSAGE);

const tsconfigCache = new Map<string, ts.ParsedCommandLine>();
const moduleResolutionCache = new Map<string, string | null>();
const exportCheckCache = new Map<string, Map<string, boolean>>();
const nearestNgCache = new Map<string, string | null>();
const tsFileCache = new Map<string, string[]>();

export default createRule<RuleOptions, MessageIds>({
    create(context, [options]) {
        const allowedPackages = normalizeFilter(options.importFilter);
        const strict = options.strict ?? false;

        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;

                if (typeof importPath !== 'string') {
                    return;
                }

                const shortName = extractPackageName(importPath);

                const allowed = allowedPackages.some((pkg) => {
                    if (shortName && pkg instanceof RegExp) {
                        return pkg.test(shortName);
                    }

                    return pkg === shortName;
                });

                if (!allowed) {
                    return;
                }

                if (!strict && isNestedImport(importPath)) {
                    return;
                }

                const symbols = extractImportedSymbols(node);

                if (symbols.length === 0) {
                    return;
                }

                const filename = context.filename;
                const rootEntry = resolveRootEntryPoint(importPath, filename);

                if (!rootEntry) {
                    return context.report({
                        messageId: MESSAGE_ID,
                        node,
                    });
                }

                const nested = findNestedEntryPoints(rootEntry);

                if (nested.length === 0) {
                    return context.report({
                        messageId: MESSAGE_ID,
                        node,
                    });
                }

                const symbolMap = mapSymbolsToEntryPoints(
                    rootEntry,
                    nested,
                    symbols,
                    strict,
                );

                if (symbolMap.size === 0) {
                    return;
                }

                const newImports = buildImports(node, importPath, symbolMap);

                context.report({
                    fix(fixer) {
                        return fixer.replaceTextRange(node.range, newImports);
                    },
                    messageId: MESSAGE_ID,
                    node,
                });
            },
        };
    },
    defaultOptions: [
        {
            importFilter: [],
            strict: false,
        },
    ],
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [
            {
                additionalProperties: false,
                properties: {
                    importFilter: {type: ['string', 'array']},
                    strict: {type: 'boolean'},
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },

    name: 'prefer-deep-imports',
});

function extractPackageName(importPath: string): string | null {
    if (!importPath.startsWith('@')) {
        return null;
    }

    const p = importPath.split('/');

    return p.length >= 2 ? `${p[0]}/${p[1]}` : null;
}

function isNestedImport(importPath: string): boolean {
    return importPath.split('/').length > 2;
}

function extractImportedSymbols(node: TSESTree.ImportDeclaration): string[] {
    return node.specifiers
        .filter(
            (s): s is TSESTree.ImportSpecifier =>
                s.type === AST_NODE_TYPES.ImportSpecifier,
        )
        .map((s) =>
            s.imported.type === AST_NODE_TYPES.Identifier
                ? s.imported.name
                : s.imported.value,
        );
}

function resolveRootEntryPoint(importPath: string, fromFile: string): string | null {
    const key = `${importPath}|${fromFile}`;

    if (moduleResolutionCache.has(key)) {
        return moduleResolutionCache.get(key)!;
    }

    const tsconfig = findNearestTsconfig(fromFile);

    if (!tsconfig) {
        moduleResolutionCache.set(key, null);

        return null;
    }

    let parsed = tsconfigCache.get(tsconfig);

    if (!parsed) {
        const json = ts.readConfigFile(tsconfig, ts.sys.readFile).config;

        parsed = ts.parseJsonConfigFileContent(json, ts.sys, path.dirname(tsconfig));
        tsconfigCache.set(tsconfig, parsed);
    }

    const resolved = ts.resolveModuleName(
        importPath,
        fromFile,
        parsed.options,
        ts.sys,
    ).resolvedModule;

    const value = resolved ? path.dirname(resolved.resolvedFileName) : null;

    moduleResolutionCache.set(key, value);

    return value;
}

function findNearestTsconfig(start: string): string | null {
    let dir = path.dirname(start);
    const limit = process.cwd();

    while (dir.startsWith(limit)) {
        const candidate = path.join(dir, 'tsconfig.json');

        if (fs.existsSync(candidate)) {
            return candidate;
        }

        const parent = path.dirname(dir);

        if (parent === dir) {
            break;
        }

        dir = parent;
    }

    return null;
}

function findNestedEntryPoints(root: string): string[] {
    const cached = tsFileCache.get(`${root}|ng`);

    if (cached) {
        return cached;
    }

    const found = globSync('**/ng-package.json', {absolute: false, cwd: root})
        .map((p) => p.replaceAll('\\', '/'))
        .map((p) => p.replace('/ng-package.json', ''))
        .filter((dir) => dir !== '.');

    tsFileCache.set(`${root}|ng`, found);

    return found;
}

function mapSymbolsToEntryPoints(
    root: string,
    nested: string[],
    symbols: string[],
    strict: boolean,
): Map<string, string> {
    const result = new Map<string, string>();
    const remaining = new Set(symbols);

    for (const np of nested) {
        if (remaining.size === 0) {
            break;
        }

        const full = path.join(root, np);

        let files = tsFileCache.get(full);

        if (!files) {
            files = globSync('**/*.ts', {
                absolute: true,
                cwd: full,
                ignore: ['**/*.spec.ts', '**/*.cy.ts'],
            });
            tsFileCache.set(full, files);
        }

        for (const file of files) {
            const content = safeReadFile(file);

            if (!content) {
                continue;
            }

            for (const symbol of Array.from(remaining)) {
                const has =
                    cachedContainsDirectExport(file, content, symbol) ||
                    cachedContainsReExport(file, content, symbol);

                if (!has) {
                    continue;
                }

                const nearest = cachedNearestNg(file, root);

                if (!nearest) {
                    continue;
                }

                let suffix = path.relative(root, nearest).replaceAll('\\', '/');

                if (!strict && suffix.includes('/')) {
                    suffix = suffix.split('/')[0]!;
                }

                result.set(symbol, suffix);
                remaining.delete(symbol);
            }
        }
    }

    return result;
}

function cachedContainsDirectExport(
    file: string,
    content: string,
    symbol: string,
): boolean {
    let cache = exportCheckCache.get(file);

    if (!cache) {
        cache = new Map();
        exportCheckCache.set(file, cache);
    }

    const key = `direct:${symbol}`;

    if (cache.has(key)) {
        return cache.get(key)!;
    }

    const res = containsDirectExport(content, symbol);

    cache.set(key, res);

    return res;
}

function cachedContainsReExport(file: string, content: string, symbol: string): boolean {
    let cache = exportCheckCache.get(file);

    if (!cache) {
        cache = new Map();
        exportCheckCache.set(file, cache);
    }

    const key = `re:${symbol}`;

    if (cache.has(key)) {
        return cache.get(key)!;
    }

    const res = containsReExport(file, content, symbol);

    cache.set(key, res);

    return res;
}

function containsDirectExport(content: string, symbol: string): boolean {
    const re = new RegExp(
        String.raw`(?:export\s+(?:function|class|const|let|var)\s+${symbol}\b)|` +
            String.raw`(?:export\s*\{[^}]*\b${symbol}\b[^}]*\})`,
    );

    return re.test(content);
}

function containsReExport(file: string, content: string, symbol: string): boolean {
    const star = /export\s*\*\s*from\s*['"](.+)['"]/g;
    let m: RegExpExecArray | null;

    while ((m = star.exec(content))) {
        const resolved = resolveReExport(file, m[1]!);

        if (!resolved) {
            continue;
        }

        const nested = safeReadFile(resolved);

        if (nested && containsDirectExport(nested, symbol)) {
            return true;
        }
    }

    const named = new RegExp(
        String.raw`export\s*\{[^}]*\b${symbol}\b[^}]*\}\s*from\s*['"](.+)['"]`,
    );

    const nm = named.exec(content);

    if (nm) {
        const resolved = resolveReExport(file, nm[1]!);

        if (!resolved) {
            return false;
        }

        const nested = safeReadFile(resolved);

        if (nested && containsDirectExport(nested, symbol)) {
            return true;
        }
    }

    return false;
}

function resolveReExport(file: string, rel: string): string | null {
    const full = path.resolve(path.dirname(file), rel);

    return fs.existsSync(full) ? full : null;
}

function cachedNearestNg(file: string, root: string): string | null {
    const key = `${file}|${root}`;

    if (nearestNgCache.has(key)) {
        return nearestNgCache.get(key)!;
    }

    let dir = path.dirname(file);

    while (dir.startsWith(root)) {
        const candidate = path.join(dir, 'ng-package.json');

        if (fs.existsSync(candidate)) {
            nearestNgCache.set(key, dir);

            return dir;
        }

        const parent = path.dirname(dir);

        if (parent === dir) {
            break;
        }

        dir = parent;
    }

    nearestNgCache.set(key, null);

    return null;
}

function buildImports(
    node: TSESTree.ImportDeclaration,
    baseImport: string,
    symbolMap: Map<string, string>,
): string {
    const isTypeOnly = node.importKind === 'type';

    const groups = new Map<string, string[]>();

    for (const [symbol, suffix] of symbolMap.entries()) {
        const target = suffix ? `${baseImport}/${suffix}` : baseImport;

        if (!groups.has(target)) {
            groups.set(target, []);
        }

        groups.get(target)!.push(symbol);
    }

    const result: string[] = [];

    for (const [target, symbols] of groups.entries()) {
        const importParts = symbols.map((symbol) => {
            const sp = node.specifiers.find(
                (s): s is TSESTree.ImportSpecifier =>
                    s.type === AST_NODE_TYPES.ImportSpecifier &&
                    (s.imported.type === AST_NODE_TYPES.Identifier
                        ? s.imported.name === symbol
                        : s.imported.value === symbol),
            );

            if (!sp) {
                return symbol;
            }

            const local = sp.local.name;

            return symbol === local ? symbol : `${symbol} as ${local}`;
        });

        result.push(
            `import ${isTypeOnly ? 'type ' : ''}{${importParts.join(
                ', ',
            )}} from '${target}';`,
        );
    }

    return result.join('\n');
}

function safeReadFile(file: string): string | null {
    try {
        return fs.readFileSync(file, 'utf8');
    } catch {
        return null;
    }
}

function normalizeFilter(filter: string[] | string): Array<RegExp | string> {
    const arr = Array.isArray(filter) ? filter : [filter];

    return arr.map((item) => {
        if (typeof item === 'string' && item.startsWith('/') && item.endsWith('/')) {
            const body = item.slice(1, -1);

            return new RegExp(body);
        }

        return item;
    });
}
