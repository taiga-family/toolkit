import path from 'node:path';

import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

import {getMemberExpressionPropertyName} from '../utils/ast/property-names';
import {createRule} from '../utils/create-rule';
import {getResolvedVariable} from '../utils/eslint/scope';
import {
    getTypeAwareRuleContext,
    type TypeAwareRuleContext,
} from '../utils/typescript/type-aware-context';

type MessageId =
    | 'importCycle'
    | 'missingDefaultExport'
    | 'namedAsDefault'
    | 'unknownNamespaceMember';

type Options = [
    {
        checkCycles?: boolean;
        checkDefaultImports?: boolean;
        checkNamedAsDefault?: boolean;
        checkNamespaceMembers?: boolean;
        ignoreExternalDefaultImports?: boolean;
    }?,
];

interface ImportGraphEdge {
    readonly moduleSpecifier: string;
    readonly targetFileName: string;
}

interface ImportGraphCache {
    readonly componentIdByFileName: ReadonlyMap<string, number>;
    readonly componentSizeById: ReadonlyMap<number, number>;
    readonly dependenciesByFileName: ReadonlyMap<string, readonly ImportGraphEdge[]>;
    readonly displayFileNameByFileName: ReadonlyMap<string, string>;
    readonly selfCycleFileNames: ReadonlySet<string>;
}

interface ResolutionState {
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

const importGraphCacheByProgram = new WeakMap<ts.Program, ImportGraphCache>();
const defaultExportCacheByProgram = new WeakMap<ts.Program, Map<string, boolean>>();
const moduleExportNamesCache = new WeakMap<ts.Symbol, ReadonlySet<string>>();
const resolutionStateByProgram = new WeakMap<ts.Program, ResolutionState>();
const sourceFileCacheByProgram = new WeakMap<ts.Program, Map<string, ts.SourceFile>>();
const codeFileExtensionRegExp = /\.[cm]?[jt]sx?$/;

function createCanonicalFileName(): (fileName: string) => string {
    const useCaseSensitiveFileNames = ts.sys.useCaseSensitiveFileNames;

    return (fileName: string) => {
        const resolvedFileName = path.resolve(fileName).replaceAll('\\', '/');

        return useCaseSensitiveFileNames
            ? resolvedFileName
            : resolvedFileName.toLowerCase();
    };
}

function getResolutionState(program: ts.Program): ResolutionState {
    const cached = resolutionStateByProgram.get(program);

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

    resolutionStateByProgram.set(program, state);

    return state;
}

function normalizeSlashes(fileName: string): string {
    return fileName.replaceAll('\\', '/');
}

function isProjectCodeFile(sourceFile: ts.SourceFile): boolean {
    const normalizedFileName = normalizeSlashes(sourceFile.fileName);

    return (
        !sourceFile.isDeclarationFile &&
        codeFileExtensionRegExp.test(normalizedFileName) &&
        !normalizedFileName.includes('/node_modules/')
    );
}

function resolveModule(
    program: ts.Program,
    containingFile: string,
    moduleSpecifier: string,
): ts.ResolvedModuleFull | null {
    const compilerOptions = program.getCompilerOptions();
    const {compilerHost, resolutionCache} = getResolutionState(program);
    const resolved =
        ts.resolveModuleName(
            moduleSpecifier,
            containingFile,
            compilerOptions,
            compilerHost,
            resolutionCache,
        ).resolvedModule ?? null;

    return resolved;
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

            edges.push({moduleSpecifier, targetFileName});
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
        componentIdByFileName,
        componentSizeById,
        dependenciesByFileName,
        displayFileNameByFileName,
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

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, sourceCode, tsProgram} =
            getTypeAwareRuleContext(context);
        const checkCycles = context.options[0]?.checkCycles ?? true;
        const checkDefaultImports = context.options[0]?.checkDefaultImports ?? true;
        const checkNamedAsDefault = context.options[0]?.checkNamedAsDefault ?? true;
        const checkNamespaceMembers = context.options[0]?.checkNamespaceMembers ?? true;
        const ignoreExternalDefaultImports =
            context.options[0]?.ignoreExternalDefaultImports ?? true;
        const canonicalFileName = createCanonicalFileName();
        const currentFileName = canonicalFileName(context.filename);
        const namespaceImports = new Map<string, NamespaceImportUsage>();

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

            context.report({
                data: {
                    cyclePath: formatCyclePath(
                        graph,
                        currentFileName,
                        targetFileName,
                        context.cwd,
                    ),
                },
                messageId: 'importCycle',
                node: sourceNode,
            });
        }

        function checkDefaultImport(node: TSESTree.ImportDeclaration): void {
            if (
                (!checkDefaultImports && !checkNamedAsDefault) ||
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
                messageId: 'unknownNamespaceMember',
                node: node.property,
            });
        }

        return {
            ExportAllDeclaration: checkImportCycle,
            ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
                checkImportCycle(node);
                checkNamedAsDefaultExport(node);
            },
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                checkImportCycle(node);
                checkDefaultImport(node);
                collectNamespaceImport(node);
            },
            MemberExpression: checkNamespaceMember,
        };
    },
    meta: {
        docs: {
            description:
                'Fast replacement for import/default, import/namespace, import/no-cycle, and import/no-named-as-default checks',
        },
        messages: {
            importCycle: 'Import cycle detected: {{cyclePath}}.',
            missingDefaultExport: 'No default export found in "{{moduleSpecifier}}".',
            namedAsDefault:
                'Using exported name "{{name}}" as identifier for default export.',
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
                    checkNamedAsDefault: {
                        description:
                            'Report default imports and default re-exports named after a named export from the same module. Defaults to true.',
                        type: 'boolean',
                    },
                    checkNamespaceMembers: {
                        description:
                            'Report static namespace import member accesses that are not exported by the imported module. Defaults to true.',
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
