import path from 'node:path';

import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import {type RuleFixer} from '@typescript-eslint/utils/ts-eslint';
import ts from 'typescript';

import {
    getMemberExpressionPropertyName,
    getObjectPropertyName,
} from '../utils/ast/property-names';
import {createRule} from '../utils/create-rule';
import {getResolvedVariable} from '../utils/eslint/scope';
import {
    getTypeAwareRuleContext,
    type TypeAwareRuleContext,
} from '../utils/typescript/type-aware-context';

type MessageId =
    | 'duplicateImport'
    | 'importCycle'
    | 'missingDefaultExport'
    | 'namedAsDefault'
    | 'namedAsDefaultMember'
    | 'selfImport'
    | 'unknownNamespaceMember';

type Options = [
    {
        checkCycles?: boolean;
        checkDefaultImports?: boolean;
        checkDuplicateImports?: boolean;
        checkNamedAsDefault?: boolean;
        checkNamedAsDefaultMembers?: boolean;
        checkNamespaceMembers?: boolean;
        checkSelfImports?: boolean;
        ignoreExternalDefaultImports?: boolean;
    }?,
];

interface ImportGraphEdge {
    readonly isImport: boolean;
    readonly moduleSpecifier: string;
    readonly targetFileName: string;
}

interface ImportGraphCache {
    // Canonical file names of files that have at least one re-export edge (export * / export {...} from)
    readonly barrelFileNames: ReadonlySet<string>;
    readonly componentIdByFileName: ReadonlyMap<string, number>;
    readonly componentSizeById: ReadonlyMap<number, number>;
    readonly dependenciesByFileName: ReadonlyMap<string, readonly ImportGraphEdge[]>;
    readonly displayFileNameByFileName: ReadonlyMap<string, string>;
    // True for each SCC component that contains at least one ImportDeclaration edge
    // between two files in the same component.
    readonly sccHasImportEdgeById: ReadonlyMap<number, boolean>;
    readonly selfCycleFileNames: ReadonlySet<string>;
}

interface FallbackResolutionState {
    readonly compilerHost: ts.CompilerHost;
    readonly resolutionCache: ts.ModuleResolutionCache;
}

interface TarjanNodeState {
    index: number;
    lowLink: number;
    onStack: boolean;
}

interface NamespaceImportUsage {
    readonly exportNames: ReadonlySet<string>;
    readonly moduleSpecifier: string;
    readonly node: TSESTree.ImportNamespaceSpecifier;
    readonly variable: TSESLint.Scope.Variable;
}

interface DefaultImportUsage {
    readonly exportNames: ReadonlySet<string>;
    readonly moduleSpecifier: string;
    readonly node: TSESTree.ImportDefaultSpecifier;
    readonly variable: TSESLint.Scope.Variable;
}

interface DuplicateImportMaps {
    readonly importsByModule: Map<string, TSESTree.ImportDeclaration[]>;
    readonly namespaceImportsByModule: Map<string, TSESTree.ImportDeclaration[]>;
}

const importGraphCacheByProgram = new WeakMap<ts.Program, ImportGraphCache>();
const defaultExportCacheByProgram = new WeakMap<ts.Program, Map<string, boolean>>();
const fallbackResolutionByProgram = new WeakMap<ts.Program, FallbackResolutionState>();
const moduleExportNamesCache = new WeakMap<ts.Symbol, ReadonlySet<string>>();
const sourceFileCacheByProgram = new WeakMap<ts.Program, Map<string, ts.SourceFile>>();
const codeFileExtensionRegExp = /\.[cm]?[jt]sx?$/;

// Angular DI functions resolve tokens at instantiation time, not at module load time,
// so cycles where all usages are DI-only are safe and should not be reported.
const ANGULAR_DI_FIRST_ARG_FUNCTIONS = new Set([
    'contentChild',
    'contentChildren',
    'inject',
    'viewChild',
    'viewChildren',
]);

function createCanonicalFileName(): (fileName: string) => string {
    const useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;

    return (fileName: string) => {
        const resolvedFileName = path.resolve(fileName).replaceAll('\\', '/');

        return useCaseSensitiveFileNames
            ? resolvedFileName
            : resolvedFileName.toLowerCase();
    };
}

function normalizeSlashes(fileName: string): string {
    return fileName.replaceAll('\\', '/');
}

function computeRelativeImportPath(fromFile: string, toFile: string): string {
    const relative = path.relative(path.dirname(fromFile), toFile);
    const normalized = normalizeSlashes(relative).replace(codeFileExtensionRegExp, '');

    return normalized.startsWith('.') ? normalized : `./${normalized}`;
}

function isProjectCodeFile(sourceFile: ts.SourceFile): boolean {
    const normalizedFileName = normalizeSlashes(sourceFile.fileName);

    return (
        !sourceFile.isDeclarationFile &&
        codeFileExtensionRegExp.test(normalizedFileName) &&
        !normalizedFileName.includes('/node_modules/')
    );
}

// Returns the module resolution cache that the TypeScript program itself populated during
// compilation. Not part of the public ts.Program API but available at runtime on TS 4+.
function getProgramResolutionCache(program: ts.Program): ts.ModuleResolutionCache | null {
    const record = program as unknown as Record<string, unknown>;
    const getCache = record['getModuleResolutionCache'];

    if (typeof getCache !== 'function') {
        return null;
    }

    const cache: unknown = (getCache as () => unknown).call(program);

    if (
        cache === null ||
        typeof cache !== 'object' ||
        !('getOrCreateCacheForDirectory' in cache)
    ) {
        return null;
    }

    return cache as ts.ModuleResolutionCache;
}

function getFallbackResolution(program: ts.Program): FallbackResolutionState {
    const cached = fallbackResolutionByProgram.get(program);

    if (cached) {
        return cached;
    }

    const compilerOptions = program.getCompilerOptions();

    const state = {
        compilerHost: ts.createCompilerHost(compilerOptions, true),
        resolutionCache: ts.createModuleResolutionCache(
            program.getCurrentDirectory(),
            (fileName) => fileName,
            compilerOptions,
        ),
    };

    fallbackResolutionByProgram.set(program, state);

    return state;
}

function resolveModule(
    program: ts.Program,
    containingFile: string,
    moduleSpecifier: string,
): ts.ResolvedModuleFull | null {
    // Prefer the program's own resolution cache (already populated during compilation)
    // over running a fresh resolution, which requires file system access per unique
    // (directory, module) pair and dominates lint time on cold starts.
    const programCache = getProgramResolutionCache(program);

    if (programCache) {
        const fromCache = ts.resolveModuleNameFromCache(
            moduleSpecifier,
            containingFile,
            programCache,
        );

        if (fromCache !== undefined) {
            return fromCache.resolvedModule ?? null;
        }
    }

    const {compilerHost, resolutionCache} = getFallbackResolution(program);

    return (
        ts.resolveModuleName(
            moduleSpecifier,
            containingFile,
            program.getCompilerOptions(),
            compilerHost,
            resolutionCache,
        ).resolvedModule ?? null
    );
}

function resolveModuleFileName(
    program: ts.Program,
    containingFile: string,
    moduleSpecifier: string,
): string | null {
    const resolved = resolveModule(program, containingFile, moduleSpecifier);

    if (!resolved || resolved.isExternalLibraryImport) {
        return null;
    }

    return resolved.resolvedFileName;
}

function getModuleSpecifierPath(moduleSpecifier: string): string {
    const queryIndex = moduleSpecifier.indexOf('?');

    return queryIndex === -1 ? moduleSpecifier : moduleSpecifier.slice(0, queryIndex);
}

function resolveModuleKey(
    program: ts.Program,
    containingFile: string,
    moduleSpecifier: string,
    canonicalFileName: (fileName: string) => string,
): string {
    const moduleSpecifierPath = getModuleSpecifierPath(moduleSpecifier);
    const resolved = resolveModule(program, containingFile, moduleSpecifierPath);

    if (!resolved) {
        return moduleSpecifier;
    }

    const queryIndex = moduleSpecifier.indexOf('?');
    const query = queryIndex === -1 ? '' : moduleSpecifier.slice(queryIndex);

    return `${canonicalFileName(resolved.resolvedFileName)}${query}`;
}

function getDefaultImportName(node: TSESTree.ImportDeclaration): string | null {
    const defaultImport = node.specifiers.find(
        (specifier): specifier is TSESTree.ImportDefaultSpecifier =>
            specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
    );

    return defaultImport?.local.name ?? null;
}

function hasNamespaceImport(node: TSESTree.ImportDeclaration): boolean {
    return node.specifiers.some(
        (specifier) => specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
    );
}

function hasTypeOnlyDefaultImport(node: TSESTree.ImportDeclaration): boolean {
    return node.importKind === 'type' && getDefaultImportName(node) !== null;
}

function hasImportAttributes(node: TSESTree.ImportDeclaration): boolean {
    const record = node as unknown as Record<string, unknown>;
    const attributes = record['attributes'];
    const assertions = record['assertions'];

    return (
        (Array.isArray(attributes) && attributes.length > 0) ||
        (Array.isArray(assertions) && assertions.length > 0)
    );
}

function hasProblematicImportComments(
    node: TSESTree.ImportDeclaration,
    sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
    const text = sourceCode.getText(node);

    return (
        text.includes('/*') ||
        text.includes('//') ||
        sourceCode
            .getCommentsBefore(node)
            .some((comment) => comment.loc.end.line >= node.loc.start.line - 1) ||
        sourceCode
            .getCommentsAfter(node)
            .some((comment) => comment.loc.start.line === node.loc.end.line)
    );
}

function getNamedSpecifierText(
    node: TSESTree.ImportDeclaration,
    specifier: TSESTree.ImportSpecifier,
    sourceCode: Readonly<TSESLint.SourceCode>,
): string {
    const text = sourceCode.getText(specifier);
    const isTypeOnly = node.importKind === 'type' || specifier.importKind === 'type';

    return isTypeOnly && !text.trimStart().startsWith('type ') ? `type ${text}` : text;
}

function getNamedSpecifierKey(text: string): string {
    return text.trim().replace(/^type\s+/, '');
}

function importDeclarationHasRuntimeEdge(node: ts.ImportDeclaration): boolean {
    const importClause = node.importClause;

    if (!importClause) {
        return true;
    }

    if (importClause.isTypeOnly) {
        return false;
    }

    if (importClause.name) {
        return true;
    }

    const namedBindings = importClause.namedBindings;

    if (!namedBindings) {
        return false;
    }

    if (ts.isNamespaceImport(namedBindings)) {
        return true;
    }

    return (
        namedBindings.elements.length === 0 ||
        namedBindings.elements.some((specifier) => !specifier.isTypeOnly)
    );
}

function exportDeclarationHasRuntimeEdge(node: ts.ExportDeclaration): boolean {
    if (node.isTypeOnly) {
        return false;
    }

    const exportClause = node.exportClause;

    if (!exportClause || ts.isNamespaceExport(exportClause)) {
        return true;
    }

    return (
        exportClause.elements.length === 0 ||
        exportClause.elements.some((specifier) => !specifier.isTypeOnly)
    );
}

function getRuntimeModuleSpecifier(statement: ts.Statement): string | null {
    if (ts.isImportDeclaration(statement)) {
        const {moduleSpecifier} = statement;

        return ts.isStringLiteralLike(moduleSpecifier) &&
            importDeclarationHasRuntimeEdge(statement)
            ? moduleSpecifier.text
            : null;
    }

    if (ts.isExportDeclaration(statement)) {
        const {moduleSpecifier} = statement;

        return moduleSpecifier &&
            ts.isStringLiteralLike(moduleSpecifier) &&
            exportDeclarationHasRuntimeEdge(statement)
            ? moduleSpecifier.text
            : null;
    }

    if (
        ts.isImportEqualsDeclaration(statement) &&
        !statement.isTypeOnly &&
        ts.isExternalModuleReference(statement.moduleReference)
    ) {
        const expression = statement.moduleReference.expression;

        return ts.isStringLiteralLike(expression) ? expression.text : null;
    }

    return null;
}

function buildDependenciesByFileName(
    program: ts.Program,
    canonicalFileName: (fileName: string) => string,
): {
    dependenciesByFileName: Map<string, ImportGraphEdge[]>;
    displayFileNameByFileName: Map<string, string>;
} {
    const sourceFiles = program.getSourceFiles().filter(isProjectCodeFile);

    const projectFileNames = new Set(
        sourceFiles.map((sourceFile) => canonicalFileName(sourceFile.fileName)),
    );

    const dependenciesByFileName = new Map<string, ImportGraphEdge[]>();
    const displayFileNameByFileName = new Map<string, string>();

    for (const sourceFile of sourceFiles) {
        const fileName = canonicalFileName(sourceFile.fileName);
        const edges: ImportGraphEdge[] = [];

        displayFileNameByFileName.set(fileName, sourceFile.fileName);

        for (const statement of sourceFile.statements) {
            const moduleSpecifier = getRuntimeModuleSpecifier(statement);

            if (!moduleSpecifier) {
                continue;
            }

            const resolvedFileName = resolveModuleFileName(
                program,
                sourceFile.fileName,
                moduleSpecifier,
            );

            if (!resolvedFileName) {
                continue;
            }

            const targetFileName = canonicalFileName(resolvedFileName);

            if (!projectFileNames.has(targetFileName)) {
                continue;
            }

            edges.push({
                isImport: ts.isImportDeclaration(statement),
                moduleSpecifier,
                targetFileName,
            });
        }

        dependenciesByFileName.set(fileName, edges);
    }

    return {dependenciesByFileName, displayFileNameByFileName};
}

function findStronglyConnectedComponents(
    dependenciesByFileName: ReadonlyMap<string, readonly ImportGraphEdge[]>,
): {
    componentIdByFileName: Map<string, number>;
    componentSizeById: Map<number, number>;
} {
    let nextComponentId = 0;
    let nextIndex = 0;
    const componentIdByFileName = new Map<string, number>();
    const componentSizeById = new Map<number, number>();
    const nodeStateByFileName = new Map<string, TarjanNodeState>();
    const stack: string[] = [];

    function visit(fileName: string): void {
        const state = {
            index: nextIndex,
            lowLink: nextIndex,
            onStack: true,
        };

        nextIndex += 1;
        nodeStateByFileName.set(fileName, state);
        stack.push(fileName);

        for (const edge of dependenciesByFileName.get(fileName) ?? []) {
            const targetState = nodeStateByFileName.get(edge.targetFileName);

            if (!targetState) {
                visit(edge.targetFileName);

                const visitedTargetState = nodeStateByFileName.get(edge.targetFileName);

                if (visitedTargetState) {
                    state.lowLink = Math.min(state.lowLink, visitedTargetState.lowLink);
                }

                continue;
            }

            if (targetState.onStack) {
                state.lowLink = Math.min(state.lowLink, targetState.index);
            }
        }

        if (state.lowLink !== state.index) {
            return;
        }

        const componentId = nextComponentId;
        let componentSize = 0;
        let shouldPop = stack.length > 0;

        nextComponentId += 1;

        while (shouldPop) {
            const memberFileName = stack.pop();

            if (!memberFileName) {
                shouldPop = false;
                continue;
            }

            const memberState = nodeStateByFileName.get(memberFileName);

            if (memberState) {
                memberState.onStack = false;
            }

            componentSize += 1;
            componentIdByFileName.set(memberFileName, componentId);
            shouldPop = stack.length > 0 && memberFileName !== fileName;
        }

        componentSizeById.set(componentId, componentSize);
    }

    for (const fileName of dependenciesByFileName.keys()) {
        if (!nodeStateByFileName.has(fileName)) {
            visit(fileName);
        }
    }

    return {componentIdByFileName, componentSizeById};
}

function collectSelfCycles(
    dependenciesByFileName: ReadonlyMap<string, readonly ImportGraphEdge[]>,
): Set<string> {
    const selfCycleFileNames = new Set<string>();

    for (const [fileName, edges] of dependenciesByFileName) {
        if (edges.some((edge) => edge.targetFileName === fileName)) {
            selfCycleFileNames.add(fileName);
        }
    }

    return selfCycleFileNames;
}

function buildSccHasImportEdge(
    dependenciesByFileName: ReadonlyMap<string, readonly ImportGraphEdge[]>,
    componentIdByFileName: ReadonlyMap<string, number>,
): Map<number, boolean> {
    const result = new Map<number, boolean>();

    for (const [fileName, edges] of dependenciesByFileName) {
        const sourceComponentId = componentIdByFileName.get(fileName);

        if (sourceComponentId === undefined || result.get(sourceComponentId) === true) {
            continue;
        }

        for (const edge of edges) {
            if (
                edge.isImport &&
                componentIdByFileName.get(edge.targetFileName) === sourceComponentId
            ) {
                result.set(sourceComponentId, true);
                break;
            }
        }
    }

    return result;
}

function buildBarrelFileNames(
    dependenciesByFileName: ReadonlyMap<string, readonly ImportGraphEdge[]>,
): ReadonlySet<string> {
    const result = new Set<string>();

    for (const [fileName, edges] of dependenciesByFileName) {
        if (edges.some((edge) => !edge.isImport)) {
            result.add(fileName);
        }
    }

    return result;
}

function getImportGraph(program: ts.Program): ImportGraphCache {
    const cached = importGraphCacheByProgram.get(program);

    if (cached) {
        return cached;
    }

    const canonicalFileName = createCanonicalFileName();

    const {dependenciesByFileName, displayFileNameByFileName} =
        buildDependenciesByFileName(program, canonicalFileName);

    const {componentIdByFileName, componentSizeById} =
        findStronglyConnectedComponents(dependenciesByFileName);

    const cache = {
        barrelFileNames: buildBarrelFileNames(dependenciesByFileName),
        componentIdByFileName,
        componentSizeById,
        dependenciesByFileName,
        displayFileNameByFileName,
        sccHasImportEdgeById: buildSccHasImportEdge(
            dependenciesByFileName,
            componentIdByFileName,
        ),
        selfCycleFileNames: collectSelfCycles(dependenciesByFileName),
    };

    importGraphCacheByProgram.set(program, cache);

    return cache;
}

function getSourceFileByFileName(
    program: ts.Program,
    fileName: string,
): ts.SourceFile | null {
    const cached = sourceFileCacheByProgram.get(program);
    const canonicalFileName = createCanonicalFileName();
    const normalizedFileName = canonicalFileName(fileName);

    if (cached) {
        return cached.get(normalizedFileName) ?? null;
    }

    const sourceFileByFileName = new Map<string, ts.SourceFile>();

    for (const sourceFile of program.getSourceFiles()) {
        sourceFileByFileName.set(canonicalFileName(sourceFile.fileName), sourceFile);
    }

    sourceFileCacheByProgram.set(program, sourceFileByFileName);

    return sourceFileByFileName.get(normalizedFileName) ?? null;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    return (
        ts.canHaveModifiers(node) &&
        (ts.getModifiers(node)?.some((modifier) => modifier.kind === kind) ?? false)
    );
}

function hasRuntimeDefaultModifier(statement: ts.Statement): boolean {
    return (
        hasModifier(statement, ts.SyntaxKind.ExportKeyword) &&
        hasModifier(statement, ts.SyntaxKind.DefaultKeyword) &&
        !ts.isInterfaceDeclaration(statement) &&
        !ts.isTypeAliasDeclaration(statement)
    );
}

function exportsDefaultSpecifier(node: ts.ExportDeclaration): boolean {
    if (node.isTypeOnly || !node.exportClause || !ts.isNamedExports(node.exportClause)) {
        return false;
    }

    return node.exportClause.elements.some(
        (specifier) => !specifier.isTypeOnly && specifier.name.text === 'default',
    );
}

function sourceFileHasDefaultExport(sourceFile: ts.SourceFile): boolean {
    return sourceFile.statements.some(
        (statement) =>
            (ts.isExportAssignment(statement) && !statement.isExportEquals) ||
            hasRuntimeDefaultModifier(statement) ||
            (ts.isExportDeclaration(statement) && exportsDefaultSpecifier(statement)),
    );
}

function hasDefaultExport(program: ts.Program, fileName: string): boolean {
    const canonicalFileName = createCanonicalFileName();
    const normalizedFileName = canonicalFileName(fileName);
    let cache = defaultExportCacheByProgram.get(program);

    if (!cache) {
        cache = new Map<string, boolean>();
        defaultExportCacheByProgram.set(program, cache);
    }

    const cached = cache.get(normalizedFileName);

    if (cached !== undefined) {
        return cached;
    }

    const sourceFile = getSourceFileByFileName(program, fileName);
    const hasExport = sourceFile ? sourceFileHasDefaultExport(sourceFile) : false;

    cache.set(normalizedFileName, hasExport);

    return hasExport;
}

function hasRuntimeEstreeImport(node: TSESTree.ImportDeclaration): boolean {
    if (node.importKind === 'type') {
        return false;
    }

    if (node.specifiers.length === 0) {
        return true;
    }

    return node.specifiers.some((specifier) => {
        if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
            return true;
        }

        return specifier.importKind !== 'type';
    });
}

function hasRuntimeEstreeReExport(
    node: TSESTree.ExportAllDeclaration | TSESTree.ExportNamedDeclaration,
): boolean {
    if (node.exportKind === 'type') {
        return false;
    }

    if (node.type === AST_NODE_TYPES.ExportAllDeclaration) {
        return true;
    }

    return (
        node.specifiers.length === 0 ||
        node.specifiers.some((specifier) => specifier.exportKind !== 'type')
    );
}

function getImportOrReExportModuleSpecifier(
    node:
        | TSESTree.ExportAllDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ImportDeclaration,
): string | null {
    if (node.type === AST_NODE_TYPES.ImportDeclaration) {
        return hasRuntimeEstreeImport(node) ? node.source.value : null;
    }

    if (!node.source || !hasRuntimeEstreeReExport(node)) {
        return null;
    }

    return typeof node.source.value === 'string' ? node.source.value : null;
}

function findCyclicTargetFileName(
    graph: ImportGraphCache,
    currentFileName: string,
    moduleSpecifier: string,
): string | null {
    const currentComponentId = graph.componentIdByFileName.get(currentFileName);

    if (currentComponentId === undefined) {
        return null;
    }

    const currentComponentSize = graph.componentSizeById.get(currentComponentId) ?? 0;

    for (const edge of graph.dependenciesByFileName.get(currentFileName) ?? []) {
        if (edge.moduleSpecifier !== moduleSpecifier) {
            continue;
        }

        const isSelfCycle =
            edge.targetFileName === currentFileName &&
            graph.selfCycleFileNames.has(currentFileName);

        const isSameComponentCycle =
            currentComponentSize > 1 &&
            graph.componentIdByFileName.get(edge.targetFileName) === currentComponentId;

        if (isSelfCycle || isSameComponentCycle) {
            return edge.targetFileName;
        }
    }

    return null;
}

function findPathWithinComponent(
    graph: ImportGraphCache,
    startFileName: string,
    endFileName: string,
    componentId: number,
): string[] {
    const queue = [startFileName];
    const previousFileName = new Map<string, string | null>([[startFileName, null]]);

    for (
        let index = 0;
        index < queue.length && !previousFileName.has(endFileName);
        index += 1
    ) {
        const currentFileName = queue[index];

        if (!currentFileName) {
            continue;
        }

        for (const edge of graph.dependenciesByFileName.get(currentFileName) ?? []) {
            if (
                graph.componentIdByFileName.get(edge.targetFileName) !== componentId ||
                previousFileName.has(edge.targetFileName)
            ) {
                continue;
            }

            previousFileName.set(edge.targetFileName, currentFileName);
            queue.push(edge.targetFileName);
        }
    }

    if (!previousFileName.has(endFileName)) {
        return [startFileName, endFileName];
    }

    const pathSegments: string[] = [];
    let currentFileName: string | null = endFileName;

    while (currentFileName !== null) {
        pathSegments.push(currentFileName);

        const nextFileName = previousFileName.get(currentFileName);

        if (nextFileName === undefined) {
            return [startFileName, endFileName];
        }

        currentFileName = nextFileName;
    }

    return pathSegments.reverse();
}

function formatFileName(graph: ImportGraphCache, fileName: string, cwd: string): string {
    const displayFileName = graph.displayFileNameByFileName.get(fileName) ?? fileName;
    const relativeFileName = normalizeSlashes(path.relative(cwd, displayFileName));

    return relativeFileName || normalizeSlashes(path.basename(displayFileName));
}

function formatCyclePath(
    graph: ImportGraphCache,
    currentFileName: string,
    targetFileName: string,
    cwd: string,
): string {
    const componentId = graph.componentIdByFileName.get(currentFileName);

    if (componentId === undefined || currentFileName === targetFileName) {
        return [currentFileName, targetFileName]
            .map((fileName) => formatFileName(graph, fileName, cwd))
            .join(' -> ');
    }

    return [
        currentFileName,
        ...findPathWithinComponent(graph, targetFileName, currentFileName, componentId),
    ]
        .map((fileName) => formatFileName(graph, fileName, cwd))
        .join(' -> ');
}

function getAliasedSymbolIfNeeded(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
    return (symbol.flags & ts.SymbolFlags.Alias) === 0
        ? symbol
        : checker.getAliasedSymbol(symbol);
}

function isValueExport(checker: ts.TypeChecker, symbol: ts.Symbol): boolean {
    const exportSymbol = getAliasedSymbolIfNeeded(checker, symbol);

    return (exportSymbol.flags & ts.SymbolFlags.Value) !== 0;
}

function getModuleExportNames(
    checker: ts.TypeChecker,
    moduleSymbol: ts.Symbol,
): ReadonlySet<string> {
    const symbol = getAliasedSymbolIfNeeded(checker, moduleSymbol);
    const cached = moduleExportNamesCache.get(symbol);

    if (cached) {
        return cached;
    }

    const exportNames = new Set(
        checker
            .getExportsOfModule(symbol)
            .filter((exportSymbol) => isValueExport(checker, exportSymbol))
            .map((exportSymbol) => exportSymbol.escapedName.toString()),
    );

    moduleExportNamesCache.set(symbol, exportNames);

    return exportNames;
}

function getNamespaceImportExportNames(
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: TypeAwareRuleContext['esTreeNodeToTSNodeMap'],
    node: TSESTree.ImportDeclaration,
): ReadonlySet<string> | null {
    if (node.importKind === 'type') {
        return null;
    }

    const tsNode = esTreeNodeToTSNodeMap.get(node);

    if (!ts.isImportDeclaration(tsNode)) {
        return null;
    }

    const moduleSymbol = checker.getSymbolAtLocation(tsNode.moduleSpecifier);

    return moduleSymbol ? getModuleExportNames(checker, moduleSymbol) : null;
}

function getExportDeclarationModuleExportNames(
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: TypeAwareRuleContext['esTreeNodeToTSNodeMap'],
    node: TSESTree.ExportNamedDeclaration,
): ReadonlySet<string> | null {
    const tsNode = esTreeNodeToTSNodeMap.get(node);

    if (
        !ts.isExportDeclaration(tsNode) ||
        !tsNode.moduleSpecifier ||
        !ts.isStringLiteralLike(tsNode.moduleSpecifier)
    ) {
        return null;
    }

    const moduleSymbol = checker.getSymbolAtLocation(tsNode.moduleSpecifier);

    return moduleSymbol ? getModuleExportNames(checker, moduleSymbol) : null;
}

function getExportSpecifierName(
    name: TSESTree.ExportSpecifier['exported'],
): string | null {
    if (name.type === AST_NODE_TYPES.Identifier) {
        return name.name;
    }

    return typeof name.value === 'string' ? name.value : null;
}

function hasNamedValueExport(
    exportNames: ReadonlySet<string> | null,
    exportedName: string,
): boolean {
    return exportedName !== 'default' && (exportNames?.has(exportedName) ?? false);
}

// Angular resolves the reference lazily (at instantiation, not at module load time)
// in all of these contexts, so a cycle through them is safe at the ES module level.
function isInAngularSafeContext(
    identifier: TSESTree.Identifier | TSESTree.JSXIdentifier,
): boolean {
    // TSESTree types parent as Node (non-optional), but the root node's parent is
    // null at runtime. Widening to include null/undefined lets while(current) serve
    // as the exit condition when traversal reaches the top of the tree.
    let current: TSESTree.Node | null | undefined = identifier.parent;

    while (current) {
        // Lazy evaluation: body runs only when the function/arrow is called.
        if (
            current.type === AST_NODE_TYPES.ArrowFunctionExpression ||
            current.type === AST_NODE_TYPES.FunctionExpression ||
            current.type === AST_NODE_TYPES.FunctionDeclaration
        ) {
            return true;
        }

        // Angular decorator metadata (@Component, @Directive, etc.) is processed
        // after all modules in the cycle have finished loading.
        if (current.type === AST_NODE_TYPES.Decorator) {
            return true;
        }

        // Non-static class field initializers run at instantiation time, not at
        // module load time, so they do not create a load-time cycle edge.
        if (current.type === AST_NODE_TYPES.PropertyDefinition && !current.static) {
            return true;
        }

        current = current.parent;
    }

    return false;
}

function isImportUsedOnlyAsAngularDiFirstArg(
    node: TSESTree.ImportDeclaration,
    sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
    const valueSpecifiers = node.specifiers.filter((specifier) => {
        if (
            specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
            specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier
        ) {
            return true;
        }

        return specifier.importKind !== 'type';
    });

    if (valueSpecifiers.length === 0) {
        return false;
    }

    // True if at least one reference is a genuine DI call or lives in a lazy/decorator
    // context. Pure type-only references don't count: an import used only as a type
    // should use `import type` and is not considered safe from a cycle perspective.
    let hasSafeRuntimeUsage = false;

    for (const specifier of valueSpecifiers) {
        const [variable] = sourceCode.getDeclaredVariables(specifier);

        if (!variable || variable.references.length === 0) {
            return false;
        }

        for (const ref of variable.references) {
            const {identifier} = ref;
            const parent = identifier.parent;

            // Type-only references (e.g., param: Type<T>) don't create runtime
            // dependencies. Skip without marking hasSafeRuntimeUsage — an import
            // that is exclusively used as a type should use `import type` instead.
            if (parent.type === AST_NODE_TYPES.TSTypeReference) {
                continue;
            }

            // References inside lazy/decorator contexts don't create load-time edges.
            if (isInAngularSafeContext(identifier)) {
                hasSafeRuntimeUsage = true;
                continue;
            }

            const callee =
                parent.type === AST_NODE_TYPES.CallExpression ? parent.callee : null;

            const isDirectCall =
                callee?.type === AST_NODE_TYPES.Identifier &&
                ANGULAR_DI_FIRST_ARG_FUNCTIONS.has(callee.name);

            const isRequiredCall =
                callee?.type === AST_NODE_TYPES.MemberExpression &&
                !callee.computed &&
                callee.object.type === AST_NODE_TYPES.Identifier &&
                ANGULAR_DI_FIRST_ARG_FUNCTIONS.has(callee.object.name) &&
                callee.property.type === AST_NODE_TYPES.Identifier &&
                callee.property.name === 'required';

            if (
                parent.type !== AST_NODE_TYPES.CallExpression ||
                (!isDirectCall && !isRequiredCall) ||
                parent.arguments[0] !== identifier
            ) {
                return false;
            }

            hasSafeRuntimeUsage = true;
        }
    }

    return hasSafeRuntimeUsage;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, sourceCode, tsProgram} =
            getTypeAwareRuleContext(context);

        const checkCycles = context.options[0]?.checkCycles ?? true;
        const checkDefaultImports = context.options[0]?.checkDefaultImports ?? true;
        const checkDuplicateImports = context.options[0]?.checkDuplicateImports ?? true;
        const checkNamedAsDefault = context.options[0]?.checkNamedAsDefault ?? true;

        const checkNamedAsDefaultMembers =
            context.options[0]?.checkNamedAsDefaultMembers ?? true;

        const checkNamespaceMembers = context.options[0]?.checkNamespaceMembers ?? true;
        const checkSelfImports = context.options[0]?.checkSelfImports ?? true;

        const ignoreExternalDefaultImports =
            context.options[0]?.ignoreExternalDefaultImports ?? true;

        const canonicalFileName = createCanonicalFileName();
        const currentFileName = canonicalFileName(context.filename);
        const defaultImports = new Map<string, DefaultImportUsage>();

        const duplicateImportMaps: DuplicateImportMaps = {
            importsByModule: new Map(),
            namespaceImportsByModule: new Map(),
        };

        const namespaceImports = new Map<string, NamespaceImportUsage>();

        function getDuplicateImportMap(
            node: TSESTree.ImportDeclaration,
        ): Map<string, TSESTree.ImportDeclaration[]> {
            return hasNamespaceImport(node)
                ? duplicateImportMaps.namespaceImportsByModule
                : duplicateImportMaps.importsByModule;
        }

        function collectDuplicateImport(node: TSESTree.ImportDeclaration): void {
            if (!checkDuplicateImports) {
                return;
            }

            const moduleKey = resolveModuleKey(
                tsProgram,
                context.filename,
                node.source.value,
                canonicalFileName,
            );

            const importsByModule = getDuplicateImportMap(node);
            const imports = importsByModule.get(moduleKey) ?? [];

            imports.push(node);
            importsByModule.set(moduleKey, imports);
        }

        function buildImportRemovalFix(
            fixer: RuleFixer,
            node: TSESTree.ImportDeclaration,
        ): TSESLint.RuleFix[] {
            const [start, end] = node.range;
            const lineStart = sourceCode.text.lastIndexOf('\n', start - 1) + 1;

            const removeStart = /^\s*$/.test(sourceCode.text.slice(lineStart, start))
                ? lineStart
                : start;

            const removeEnd = sourceCode.text[end] === '\n' ? end + 1 : end;

            return [fixer.removeRange([removeStart, removeEnd])];
        }

        function buildDuplicateImportFix(
            fixer: RuleFixer,
            first: TSESTree.ImportDeclaration,
            rest: readonly TSESTree.ImportDeclaration[],
        ): readonly TSESLint.RuleFix[] | null {
            const nodes = [first, ...rest];

            if (
                nodes.some(
                    (node) =>
                        hasNamespaceImport(node) ||
                        hasTypeOnlyDefaultImport(node) ||
                        hasImportAttributes(node) ||
                        hasProblematicImportComments(node, sourceCode),
                )
            ) {
                return null;
            }

            const defaultNames = new Set(
                nodes.flatMap((node) => {
                    const name = getDefaultImportName(node);

                    return name ? [name] : [];
                }),
            );

            if (defaultNames.size > 1) {
                return null;
            }

            const namedSpecifiersByKey = new Map<string, string>();

            for (const node of nodes) {
                for (const specifier of node.specifiers) {
                    if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
                        continue;
                    }

                    const text = getNamedSpecifierText(
                        node,
                        specifier,
                        sourceCode,
                    ).trim();

                    const key = getNamedSpecifierKey(text);
                    const existing = namedSpecifiersByKey.get(key);
                    const isTypeOnly = text.startsWith('type ');

                    if (!existing || (existing.startsWith('type ') && !isTypeOnly)) {
                        namedSpecifiersByKey.set(key, text);
                    }
                }
            }

            const namedSpecifiers = [...namedSpecifiersByKey.values()];
            const [defaultName = null] = defaultNames;

            const bindings = [
                ...(defaultName ? [defaultName] : []),
                ...(namedSpecifiers.length > 0
                    ? [`{${namedSpecifiers.join(', ')}}`]
                    : []),
            ];

            const sourceText = sourceCode.getText(first.source);
            const semi = sourceCode.getText(first).endsWith(';') ? ';' : '';

            const replacement =
                bindings.length === 0
                    ? `import ${sourceText}${semi}`
                    : `import ${bindings.join(', ')} from ${sourceText}${semi}`;

            return [
                fixer.replaceText(first, replacement),
                ...rest.flatMap((node) => buildImportRemovalFix(fixer, node)),
            ];
        }

        function reportDuplicateImports(
            importsByModule: ReadonlyMap<string, readonly TSESTree.ImportDeclaration[]>,
        ): void {
            for (const nodes of importsByModule.values()) {
                if (nodes.length < 2) {
                    continue;
                }

                const [first, ...rest] = nodes;

                if (!first) {
                    continue;
                }

                const moduleSpecifier = first.source.value;

                context.report({
                    data: {moduleSpecifier},
                    fix: (fixer) => buildDuplicateImportFix(fixer, first, rest),
                    messageId: 'duplicateImport',
                    node: first.source,
                });

                for (const node of rest) {
                    context.report({
                        data: {moduleSpecifier},
                        messageId: 'duplicateImport',
                        node: node.source,
                    });
                }
            }
        }

        function reportAllDuplicateImports(): void {
            if (!checkDuplicateImports) {
                return;
            }

            reportDuplicateImports(duplicateImportMaps.importsByModule);
            reportDuplicateImports(duplicateImportMaps.namespaceImportsByModule);
        }

        function checkSelfImport(moduleSpecifier: string, node: TSESTree.Node): void {
            if (
                !checkSelfImports ||
                context.filename === '<text>' ||
                moduleSpecifier.includes('?')
            ) {
                return;
            }

            const resolved = resolveModule(
                tsProgram,
                context.filename,
                getModuleSpecifierPath(moduleSpecifier),
            );

            if (
                !resolved ||
                canonicalFileName(resolved.resolvedFileName) !== currentFileName
            ) {
                return;
            }

            context.report({
                messageId: 'selfImport',
                node,
            });
        }

        function checkDeclarationSelfImport(
            node:
                | TSESTree.ExportAllDeclaration
                | TSESTree.ExportNamedDeclaration
                | TSESTree.ImportDeclaration,
        ): void {
            if (!node.source || typeof node.source.value !== 'string') {
                return;
            }

            checkSelfImport(node.source.value, node.source);
        }

        function checkRequireSelfImport(node: TSESTree.CallExpression): void {
            if (
                node.callee.type !== AST_NODE_TYPES.Identifier ||
                node.callee.name !== 'require' ||
                node.arguments.length !== 1
            ) {
                return;
            }

            const [moduleSpecifier] = node.arguments;

            if (
                moduleSpecifier?.type !== AST_NODE_TYPES.Literal ||
                typeof moduleSpecifier.value !== 'string'
            ) {
                return;
            }

            checkSelfImport(moduleSpecifier.value, moduleSpecifier);
        }

        function checkDynamicSelfImport(node: TSESTree.ImportExpression): void {
            const {source} = node;

            if (
                source.type !== AST_NODE_TYPES.Literal ||
                typeof source.value !== 'string'
            ) {
                return;
            }

            checkSelfImport(source.value, source);
        }

        function checkImportCycle(
            node:
                | TSESTree.ExportAllDeclaration
                | TSESTree.ExportNamedDeclaration
                | TSESTree.ImportDeclaration,
        ): void {
            if (!checkCycles) {
                return;
            }

            const moduleSpecifier = getImportOrReExportModuleSpecifier(node);

            if (!moduleSpecifier) {
                return;
            }

            const sourceNode = node.source;

            if (!sourceNode) {
                return;
            }

            const graph = getImportGraph(tsProgram);

            const targetFileName = findCyclicTargetFileName(
                graph,
                currentFileName,
                moduleSpecifier,
            );

            if (!targetFileName) {
                return;
            }

            const cyclePath = formatCyclePath(
                graph,
                currentFileName,
                targetFileName,
                context.cwd,
            );

            if (node.type === AST_NODE_TYPES.ImportDeclaration) {
                // Compute the redirect replacement eagerly so we can decide whether
                // to suppress. If a redirect to the direct source file is possible,
                // always report (the fix breaks the cycle). Otherwise, suppress when
                // all usages are Angular-DI-safe (inject, class fields, etc.).
                const replacement = computeCycleBreakingReplacement(node);

                if (
                    !replacement &&
                    isImportUsedOnlyAsAngularDiFirstArg(node, sourceCode)
                ) {
                    return;
                }

                context.report({
                    data: {cyclePath},
                    fix: replacement
                        ? (fixer) => [fixer.replaceText(node, replacement)]
                        : undefined,
                    messageId: 'importCycle',
                    node: sourceNode,
                });
            } else {
                // For re-export nodes (export * from / export {x} from), suppress the
                // error when the same SCC already contains an ImportDeclaration edge.
                // That ImportDeclaration will be reported (and fixed) directly, so
                // reporting the barrel re-export would create duplicate, unfixable noise.
                const componentId = graph.componentIdByFileName.get(currentFileName);

                if (
                    componentId !== undefined &&
                    graph.sccHasImportEdgeById.get(componentId) === true
                ) {
                    return;
                }

                context.report({
                    data: {cyclePath},
                    messageId: 'importCycle',
                    node: sourceNode,
                });
            }
        }

        function computeCycleBreakingReplacement(
            node: TSESTree.ImportDeclaration,
        ): string | null {
            // Only named imports can be safely redirected to their source file
            if (node.specifiers.some((s) => s.type !== AST_NODE_TYPES.ImportSpecifier)) {
                return null;
            }

            const barrelFileName = resolveModuleFileName(
                tsProgram,
                context.filename,
                node.source.value,
            );

            const canonicalBarrelFileName = barrelFileName
                ? canonicalFileName(barrelFileName)
                : null;

            // Not a barrel (has no re-export edges) — symbols are defined locally,
            // so there is no shorter direct-source path to redirect to.
            if (
                !canonicalBarrelFileName ||
                !getImportGraph(tsProgram).barrelFileNames.has(canonicalBarrelFileName)
            ) {
                return null;
            }

            const specifiersBySourceFile = new Map<string, string[]>();

            for (const specifier of node.specifiers) {
                if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
                    return null;
                }

                const tsSpecifier = esTreeNodeToTSNodeMap.get(specifier);

                if (!ts.isImportSpecifier(tsSpecifier)) {
                    return null;
                }

                const localSymbol = checker.getSymbolAtLocation(tsSpecifier.name);

                if (!localSymbol) {
                    return null;
                }

                const originalSymbol = getAliasedSymbolIfNeeded(checker, localSymbol);
                const {declarations} = originalSymbol;
                const firstDeclaration = declarations?.[0];

                if (!firstDeclaration) {
                    return null;
                }

                const sourceFile = firstDeclaration.getSourceFile();

                if (!isProjectCodeFile(sourceFile)) {
                    return null;
                }

                const sourceFilePath = sourceFile.fileName;

                // Symbol is defined directly in the barrel — no shorter path exists
                if (canonicalBarrelFileName === canonicalFileName(sourceFilePath)) {
                    return null;
                }

                const importedName =
                    tsSpecifier.propertyName?.text ?? tsSpecifier.name.text;

                const localName = tsSpecifier.name.text;
                const typePrefix = specifier.importKind === 'type' ? 'type ' : '';

                const specText =
                    importedName === localName
                        ? `${typePrefix}${importedName}`
                        : `${typePrefix}${importedName} as ${localName}`;

                const group = specifiersBySourceFile.get(sourceFilePath) ?? [];

                group.push(specText);
                specifiersBySourceFile.set(sourceFilePath, group);
            }

            if (specifiersBySourceFile.size === 0) {
                return null;
            }

            const semi = sourceCode.getText(node).endsWith(';') ? ';' : '';
            const quote = node.source.raw[0] ?? "'";
            const importPrefix = node.importKind === 'type' ? 'import type' : 'import';
            const newImports: string[] = [];

            for (const [sourceFilePath, names] of specifiersBySourceFile) {
                const relPath = computeRelativeImportPath(
                    context.filename,
                    sourceFilePath,
                );

                newImports.push(
                    `${importPrefix} {${names.join(', ')}} from ${quote}${relPath}${quote}${semi}`,
                );
            }

            return newImports.join('\n');
        }

        function checkDefaultImport(node: TSESTree.ImportDeclaration): void {
            if (
                (!checkDefaultImports &&
                    !checkNamedAsDefault &&
                    !checkNamedAsDefaultMembers) ||
                node.importKind === 'type'
            ) {
                return;
            }

            const defaultImport = node.specifiers.find(
                (specifier): specifier is TSESTree.ImportDefaultSpecifier =>
                    specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
            );

            if (!defaultImport) {
                return;
            }

            const moduleSpecifier = node.source.value;
            const resolved = resolveModule(tsProgram, context.filename, moduleSpecifier);

            if (
                !resolved ||
                (resolved.isExternalLibraryImport && ignoreExternalDefaultImports)
            ) {
                return;
            }

            const hasResolvedDefaultExport = hasDefaultExport(
                tsProgram,
                resolved.resolvedFileName,
            );

            if (!hasResolvedDefaultExport) {
                if (!checkDefaultImports) {
                    return;
                }

                context.report({
                    data: {moduleSpecifier},
                    messageId: 'missingDefaultExport',
                    node: defaultImport,
                });

                return;
            }

            const exportNames = getNamespaceImportExportNames(
                checker,
                esTreeNodeToTSNodeMap,
                node,
            );

            if (checkNamedAsDefaultMembers && exportNames) {
                const [variable] = sourceCode.getDeclaredVariables(defaultImport);

                if (variable) {
                    defaultImports.set(defaultImport.local.name, {
                        exportNames,
                        moduleSpecifier,
                        node: defaultImport,
                        variable,
                    });
                }
            }

            if (
                !checkNamedAsDefault ||
                !hasNamedValueExport(exportNames, defaultImport.local.name)
            ) {
                return;
            }

            context.report({
                data: {name: defaultImport.local.name},
                messageId: 'namedAsDefault',
                node: defaultImport,
            });
        }

        function reportNamedAsDefaultMember(
            defaultImportIdentifier: TSESTree.Identifier,
            memberName: string | null,
            reportNode: TSESTree.Node,
        ): void {
            if (!checkNamedAsDefaultMembers || !memberName || memberName === 'default') {
                return;
            }

            const usage = defaultImports.get(defaultImportIdentifier.name);

            if (
                !usage ||
                !hasNamedValueExport(usage.exportNames, memberName) ||
                getResolvedVariable(sourceCode, defaultImportIdentifier) !==
                    usage.variable
            ) {
                return;
            }

            context.report({
                data: {
                    defaultName: usage.node.local.name,
                    memberName,
                    moduleSpecifier: usage.moduleSpecifier,
                },
                messageId: 'namedAsDefaultMember',
                node: reportNode,
            });
        }

        function checkNamedAsDefaultMemberExpression(
            node: TSESTree.MemberExpression,
        ): void {
            if (
                !checkNamedAsDefaultMembers ||
                defaultImports.size === 0 ||
                node.object.type !== AST_NODE_TYPES.Identifier
            ) {
                return;
            }

            reportNamedAsDefaultMember(
                node.object,
                getMemberExpressionPropertyName(node),
                node.property,
            );
        }

        function checkNamedAsDefaultMemberDestructuring(
            node: TSESTree.VariableDeclarator,
        ): void {
            if (
                !checkNamedAsDefaultMembers ||
                defaultImports.size === 0 ||
                node.id.type !== AST_NODE_TYPES.ObjectPattern ||
                node.init?.type !== AST_NODE_TYPES.Identifier
            ) {
                return;
            }

            for (const property of node.id.properties) {
                if (property.type !== AST_NODE_TYPES.Property) {
                    continue;
                }

                reportNamedAsDefaultMember(
                    node.init,
                    getObjectPropertyName(property),
                    property.key,
                );
            }
        }

        function checkNamedAsDefaultExport(node: TSESTree.ExportNamedDeclaration): void {
            if (
                !checkNamedAsDefault ||
                node.exportKind === 'type' ||
                !node.source ||
                typeof node.source.value !== 'string'
            ) {
                return;
            }

            const moduleSpecifier = node.source.value;
            const resolved = resolveModule(tsProgram, context.filename, moduleSpecifier);

            if (
                !resolved ||
                (resolved.isExternalLibraryImport && ignoreExternalDefaultImports) ||
                !hasDefaultExport(tsProgram, resolved.resolvedFileName)
            ) {
                return;
            }

            const exportNames = getExportDeclarationModuleExportNames(
                checker,
                esTreeNodeToTSNodeMap,
                node,
            );

            for (const specifier of node.specifiers) {
                if (
                    specifier.exportKind === 'type' ||
                    getExportSpecifierName(specifier.local) !== 'default'
                ) {
                    continue;
                }

                const exportedName = getExportSpecifierName(specifier.exported);

                if (!exportedName || !hasNamedValueExport(exportNames, exportedName)) {
                    continue;
                }

                context.report({
                    data: {name: exportedName},
                    messageId: 'namedAsDefault',
                    node: specifier.exported,
                });
            }
        }

        function collectNamespaceImport(node: TSESTree.ImportDeclaration): void {
            if (!checkNamespaceMembers) {
                return;
            }

            const namespaceImport = node.specifiers.find(
                (specifier): specifier is TSESTree.ImportNamespaceSpecifier =>
                    specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
            );

            if (!namespaceImport) {
                return;
            }

            const exportNames = getNamespaceImportExportNames(
                checker,
                esTreeNodeToTSNodeMap,
                node,
            );

            if (!exportNames) {
                return;
            }

            const [variable] = sourceCode.getDeclaredVariables(namespaceImport);

            if (!variable) {
                return;
            }

            namespaceImports.set(namespaceImport.local.name, {
                exportNames,
                moduleSpecifier: node.source.value,
                node: namespaceImport,
                variable,
            });
        }

        function buildNamespaceToNamedFix(
            fixer: RuleFixer,
            usage: NamespaceImportUsage,
        ): readonly TSESLint.RuleFix[] | null {
            const importDecl = usage.node.parent;

            if (importDecl.specifiers.length !== 1) {
                return null;
            }

            const memberNames = new Set<string>();
            const memberNodes: TSESTree.MemberExpression[] = [];

            for (const ref of usage.variable.references) {
                const parent = ref.identifier.parent;

                if (
                    parent.type !== AST_NODE_TYPES.MemberExpression ||
                    parent.object !== ref.identifier ||
                    parent.computed
                ) {
                    return null;
                }

                const memberName = getMemberExpressionPropertyName(parent);

                if (!memberName || memberName === 'default') {
                    return null;
                }

                memberNames.add(memberName);
                memberNodes.push(parent);
            }

            if (memberNames.size === 0) {
                return null;
            }

            const sourceText = sourceCode.getText(importDecl.source);
            const hasSemi = sourceCode.getText(importDecl).endsWith(';');
            const sortedMembers = [...memberNames].sort();
            const newImportText = `import {${sortedMembers.join(', ')}} from ${sourceText}${hasSemi ? ';' : ''}`;

            return [
                fixer.replaceText(importDecl, newImportText),
                ...memberNodes.flatMap((memberNode) => {
                    const name = getMemberExpressionPropertyName(memberNode);

                    return name ? [fixer.replaceText(memberNode, name)] : [];
                }),
            ];
        }

        function checkNamespaceMember(node: TSESTree.MemberExpression): void {
            if (
                !checkNamespaceMembers ||
                node.object.type !== AST_NODE_TYPES.Identifier
            ) {
                return;
            }

            const usage = namespaceImports.get(node.object.name);
            const memberName = getMemberExpressionPropertyName(node);

            if (
                !usage ||
                !memberName ||
                usage.exportNames.has(memberName) ||
                getResolvedVariable(sourceCode, node.object) !== usage.variable
            ) {
                return;
            }

            context.report({
                data: {
                    memberName,
                    moduleSpecifier: usage.moduleSpecifier,
                    namespaceName: usage.node.local.name,
                },
                fix: (fixer) => buildNamespaceToNamedFix(fixer, usage),
                messageId: 'unknownNamespaceMember',
                node: node.property,
            });
        }

        return {
            CallExpression: checkRequireSelfImport,
            ExportAllDeclaration(node: TSESTree.ExportAllDeclaration) {
                checkImportCycle(node);
                checkDeclarationSelfImport(node);
            },
            ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
                checkImportCycle(node);
                checkDeclarationSelfImport(node);
                checkNamedAsDefaultExport(node);
            },
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                checkImportCycle(node);
                checkDeclarationSelfImport(node);
                collectDuplicateImport(node);
                checkDefaultImport(node);
                collectNamespaceImport(node);
            },
            ImportExpression: checkDynamicSelfImport,
            MemberExpression(node: TSESTree.MemberExpression) {
                checkNamedAsDefaultMemberExpression(node);
                checkNamespaceMember(node);
            },
            'Program:exit': reportAllDuplicateImports,
            VariableDeclarator: checkNamedAsDefaultMemberDestructuring,
        };
    },
    meta: {
        docs: {
            description:
                'Fast replacement for import/default, import/namespace, import/no-cycle, import/no-duplicates, import/no-named-as-default, import/no-named-as-default-member, and import/no-self-import checks',
        },
        fixable: 'code',
        messages: {
            duplicateImport: '"{{moduleSpecifier}}" imported multiple times.',
            importCycle: 'Import cycle detected: {{cyclePath}}.',
            missingDefaultExport: 'No default export found in "{{moduleSpecifier}}".',
            namedAsDefault:
                'Using exported name "{{name}}" as identifier for default export.',
            namedAsDefaultMember:
                'Default import "{{defaultName}}" from "{{moduleSpecifier}}" also has a named export "{{memberName}}". Use a named import instead.',
            selfImport: 'Module imports itself.',
            unknownNamespaceMember:
                'Namespace import "{{namespaceName}}" from "{{moduleSpecifier}}" has no exported member "{{memberName}}".',
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    checkCycles: {
                        description:
                            'Report static project-local import and re-export cycles. Defaults to true.',
                        type: 'boolean',
                    },
                    checkDefaultImports: {
                        description:
                            'Report default imports from modules without a default export. Defaults to true.',
                        type: 'boolean',
                    },
                    checkDuplicateImports: {
                        description:
                            'Report repeated import declarations for the same resolved module. Defaults to true.',
                        type: 'boolean',
                    },
                    checkNamedAsDefault: {
                        description:
                            'Report default imports and default re-exports named after a named export from the same module. Defaults to true.',
                        type: 'boolean',
                    },
                    checkNamedAsDefaultMembers: {
                        description:
                            'Report property access or destructuring of default imports when the property name is a named export from the same module. Defaults to true.',
                        type: 'boolean',
                    },
                    checkNamespaceMembers: {
                        description:
                            'Report static namespace import member accesses that are not exported by the imported module. Defaults to true.',
                        type: 'boolean',
                    },
                    checkSelfImports: {
                        description:
                            'Report imports, re-exports, dynamic imports, and require() calls that resolve to the current file. Defaults to true.',
                        type: 'boolean',
                    },
                    ignoreExternalDefaultImports: {
                        description:
                            'Skip default import checks for modules resolved from external libraries. Defaults to true.',
                        type: 'boolean',
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'import-integrity',
});

export default rule;
