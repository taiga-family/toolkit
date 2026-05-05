/**
 * prefer-untracked-incidental-signal-reads
 *
 * Conservatively flags signal reads inside reactive callbacks that appear to be
 * incidental — they provide only a snapshot value passed to a side-effecting
 * consumer such as a signal write or DOM imperative call — and therefore
 * probably should be wrapped in `untracked(...)`.
 *
 * Design principle: prefer false-negatives over false-positives.
 * This rule only reports patterns it can confidently identify as suspicious.
 *
 * Limitations
 * -----------
 * Whether a signal read *should* be tracked is a question of developer intent,
 * not syntax. The rule relies on heuristics (type-based signal detection,
 * structural pattern matching) and will inevitably produce:
 *
 *  - False negatives: incidental reads that do not match the heuristics.
 *  - False positives (rare): reads that look incidental but are intentional
 *    dependencies (e.g. the developer intentionally re-runs the effect when
 *    `mousePosition` changes to keep `position` in sync).
 *
 * Always review suggestions before accepting the fix. If the reported read
 * IS meant to be a tracked dependency, disable the rule for that line.
 */
import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import {type RuleFixer} from '@typescript-eslint/utils/ts-eslint';
import type ts from 'typescript';

import {
    collectSignalUsages,
    getReactiveScopes,
    isAngularUntrackedCall,
    isNodeInsideSynchronousReactiveScope,
    isSignalReadCall,
    isWritableSignalWrite,
    type ReactiveScope,
    walkSynchronousAst,
} from '../utils/angular/angular-signals';
import {
    buildUntrackedImportFixes,
    findUntrackedAlias,
} from '../utils/angular/import-fix-helpers';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from '../utils/angular/untracked-docs';
import {isNodeInside, isNodeInsideAny} from '../utils/ast/ancestors';
import {unwrapExpression} from '../utils/ast/ast-expressions';
import {type NodeMap, type TsNodeToESTreeNodeMap} from '../utils/typescript/node-map';
import {getSymbolAtNode} from '../utils/typescript/symbols';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type MessageId = 'incidentalRead';
const CONSOLE_METHODS = new Set([
    'assert',
    'debug',
    'dir',
    'dirxml',
    'error',
    'group',
    'groupCollapsed',
    'groupEnd',
    'info',
    'log',
    'table',
    'trace',
    'warn',
]);

const HIGH_CONFIDENCE_DOM_METHODS = new Set(['requestFullscreen']);
const LIB_DOM_FILE_PATTERN = /(?:^|[\\/])lib\.dom(?:\.[^\\/]+)?\.d\.ts$/;

interface AliasResolutionContext {
    readonly checker: import('typescript').TypeChecker;
    readonly esTreeNodeToTSNodeMap: NodeMap;
    readonly scope: ReactiveScope;
    readonly tsNodeToESTreeNodeMap: TsNodeToESTreeNodeMap;
}

interface SuspiciousRead {
    readonly aliases: readonly TSESTree.Identifier[];
    readonly consumers: readonly TSESTree.CallExpression[];
    readonly read: TSESTree.CallExpression;
}

/** Returns the source text for `untracked(() => signalGetter())`. */
function buildUntrackedWrap(
    expr: TSESTree.CallExpression,
    sourceCode: {getText(n: TSESTree.Node): string},
    untrackedAlias: string,
): string {
    return `${untrackedAlias}(() => ${sourceCode.getText(expr.callee)}())`;
}

function unwrapUsageExpression(node: TSESTree.Node): TSESTree.Node {
    let current = node;

    while (
        current.parent &&
        (current.parent.type === AST_NODE_TYPES.ChainExpression ||
            current.parent.type === AST_NODE_TYPES.TSAsExpression ||
            current.parent.type === AST_NODE_TYPES.TSNonNullExpression ||
            current.parent.type === AST_NODE_TYPES.TSTypeAssertion)
    ) {
        current = current.parent;
    }

    return current;
}

function isStatementPositionCall(node: TSESTree.CallExpression): boolean {
    const usage = unwrapUsageExpression(node);

    if (usage.parent?.type === AST_NODE_TYPES.ExpressionStatement) {
        return true;
    }

    return (
        usage.parent?.type === AST_NODE_TYPES.AwaitExpression &&
        usage.parent.parent.type === AST_NODE_TYPES.ExpressionStatement
    );
}

function isConsoleMethodCall(node: TSESTree.CallExpression): boolean {
    if (
        node.callee.type !== AST_NODE_TYPES.MemberExpression ||
        node.callee.object.type !== AST_NODE_TYPES.Identifier ||
        node.callee.object.name !== 'console' ||
        node.callee.property.type !== AST_NODE_TYPES.Identifier
    ) {
        return false;
    }

    return CONSOLE_METHODS.has(node.callee.property.name);
}

function isDomImperativeCall(
    node: TSESTree.CallExpression,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        HIGH_CONFIDENCE_DOM_METHODS.has(node.callee.property.name)
    ) {
        return true;
    }

    const tsNode = esTreeNodeToTSNodeMap.get(node) as ts.CallLikeExpression | undefined;

    if (!tsNode) {
        return false;
    }

    const signature = checker.getResolvedSignature(tsNode);
    const declaration = signature?.declaration;

    if (
        !declaration ||
        !LIB_DOM_FILE_PATTERN.test(declaration.getSourceFile().fileName)
    ) {
        return false;
    }

    const returnType = checker.typeToString(checker.getReturnTypeOfSignature(signature));

    return returnType === 'void' || returnType === 'Promise<void>';
}

function isSuspiciousDomCallArgumentConsumer(
    node: TSESTree.CallExpression,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
    program: TSESTree.Program,
): boolean {
    if (
        isAngularUntrackedCall(node, program) ||
        isSignalReadCall(node, checker, esTreeNodeToTSNodeMap) ||
        isWritableSignalWrite(node, checker, esTreeNodeToTSNodeMap) ||
        !isStatementPositionCall(node) ||
        isConsoleMethodCall(node)
    ) {
        return false;
    }

    return isDomImperativeCall(node, checker, esTreeNodeToTSNodeMap);
}

function isAliasDeclarationIdentifier(node: TSESTree.Node): boolean {
    return (
        node.type === AST_NODE_TYPES.Identifier &&
        node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
        node.parent.id === node
    );
}

function aliasHasExternalUsage(
    alias: TSESTree.Identifier,
    consumers: readonly TSESTree.CallExpression[],
    scope: ReactiveScope,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    const symbol = getSymbolAtNode(alias, checker, esTreeNodeToTSNodeMap);

    if (!symbol) {
        return false;
    }

    let usedOutsideConsumers = false;

    walkSynchronousAst(scope.callback, (node) => {
        if (
            node.type !== AST_NODE_TYPES.Identifier ||
            node === alias ||
            isAliasDeclarationIdentifier(node) ||
            isNodeInsideAny(node, consumers)
        ) {
            return;
        }

        const referenceSymbol = getSymbolAtNode(node, checker, esTreeNodeToTSNodeMap);

        if (referenceSymbol !== symbol) {
            return;
        }

        usedOutsideConsumers = true;

        return false;
    });

    return usedOutsideConsumers;
}

/**
 * Collects all signal reads that appear as direct arguments to a high-confidence
 * incidental-read consumer inside a reactive scope, such as a writable-signal
 * write method or a DOM side-effect call in statement position.
 *
 * Only the topmost, direct argument reads are considered suspicious.
 * Nested reads (e.g. inside ternaries, function calls) are skipped because
 * they are harder to reason about safely.
 */
function resolveSignalReadAlias(
    expression: TSESTree.Expression,
    context: AliasResolutionContext,
    seen = new Set<string>(),
): TSESTree.CallExpression | null {
    const unwrapped = unwrapExpression(expression);

    if (
        unwrapped.type === AST_NODE_TYPES.CallExpression &&
        isSignalReadCall(unwrapped, context.checker, context.esTreeNodeToTSNodeMap)
    ) {
        return unwrapped;
    }

    if (unwrapped.type !== AST_NODE_TYPES.Identifier) {
        return null;
    }

    const symbol = getSymbolAtNode(
        unwrapped,
        context.checker,
        context.esTreeNodeToTSNodeMap,
    );

    if (!symbol) {
        return null;
    }

    const symbolId = `${symbol.name}:${symbol.declarations?.[0]?.pos ?? -1}`;

    if (seen.has(symbolId)) {
        return null;
    }

    seen.add(symbolId);

    for (const declaration of symbol.declarations ?? []) {
        const estreeDeclaration = context.tsNodeToESTreeNodeMap.get(declaration);

        if (estreeDeclaration?.type !== AST_NODE_TYPES.VariableDeclarator) {
            continue;
        }

        const variableDeclaration = estreeDeclaration.parent;

        if (
            variableDeclaration.kind !== 'const' ||
            !estreeDeclaration.init ||
            estreeDeclaration.range[0] > unwrapped.range[0] ||
            !isNodeInsideSynchronousReactiveScope(
                estreeDeclaration,
                context.scope.callback,
            )
        ) {
            continue;
        }

        const initializer = unwrapExpression(estreeDeclaration.init);

        if (
            initializer.type === AST_NODE_TYPES.CallExpression &&
            isSignalReadCall(initializer, context.checker, context.esTreeNodeToTSNodeMap)
        ) {
            return initializer;
        }

        if (initializer.type === AST_NODE_TYPES.Identifier) {
            return resolveSignalReadAlias(initializer, context, seen);
        }
    }

    return null;
}

function collectSuspiciousReads(
    scope: ReactiveScope,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
    tsNodeToESTreeNodeMap: TsNodeToESTreeNodeMap,
    program: TSESTree.Program,
): SuspiciousRead[] {
    const suspicious = new Map<
        string,
        {
            aliases: TSESTree.Identifier[];
            consumers: TSESTree.CallExpression[];
            read: TSESTree.CallExpression;
        }
    >();

    const aliasResolutionContext: AliasResolutionContext = {
        checker,
        esTreeNodeToTSNodeMap,
        scope,
        tsNodeToESTreeNodeMap,
    };

    walkSynchronousAst(scope.callback, (node) => {
        if (node.type !== AST_NODE_TYPES.CallExpression) {
            return;
        }

        // Skip already-untracked scopes
        if (isAngularUntrackedCall(node, program)) {
            return false;
        }

        if (
            !isWritableSignalWrite(node, checker, esTreeNodeToTSNodeMap) &&
            !isSuspiciousDomCallArgumentConsumer(
                node,
                checker,
                esTreeNodeToTSNodeMap,
                program,
            )
        ) {
            return;
        }

        // Inspect each direct argument of the consumer call for signal reads.
        // We intentionally do NOT recurse into nested expressions —
        // only top-level direct reads in the argument position are flagged.
        for (const arg of node.arguments) {
            if (arg.type === AST_NODE_TYPES.SpreadElement) {
                continue;
            }

            const read = resolveSignalReadAlias(arg, aliasResolutionContext);
            const unwrappedArg = unwrapExpression(arg);

            if (read) {
                const key = String(read.range);
                const existing = suspicious.get(key);

                const alias =
                    unwrappedArg.type === AST_NODE_TYPES.Identifier ? unwrappedArg : null;

                if (existing) {
                    if (!existing.consumers.includes(node)) {
                        existing.consumers.push(node);
                    }

                    if (alias && !existing.aliases.includes(alias)) {
                        existing.aliases.push(alias);
                    }
                } else {
                    suspicious.set(key, {
                        aliases: alias ? [alias] : [],
                        consumers: [node],
                        read,
                    });
                }
            }
        }

        return false;
    });

    return [...suspicious.values()];
}

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const {
            checker,
            esTreeNodeToTSNodeMap,
            program,
            sourceCode,
            tsNodeToESTreeNodeMap,
        } = getTypeAwareRuleContext(context);

        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;
        const estreeNodeMap = tsNodeToESTreeNodeMap as unknown as TsNodeToESTreeNodeMap;

        function buildFix(
            read: TSESTree.CallExpression,
        ): (fixer: RuleFixer) => Array<ReturnType<RuleFixer['replaceText']>> {
            const untrackedAlias = findUntrackedAlias(program);
            const alreadyHasUntracked = untrackedAlias != null;

            const wrapped = buildUntrackedWrap(
                read,
                sourceCode,
                untrackedAlias ?? 'untracked',
            );

            if (alreadyHasUntracked) {
                return (fixer) => [fixer.replaceText(read, wrapped)];
            }

            return (fixer) => [
                fixer.replaceText(read, wrapped),
                ...buildUntrackedImportFixes(program, fixer),
            ];
        }

        return {
            CallExpression(node: TSESTree.CallExpression) {
                for (const scope of getReactiveScopes(node, program)) {
                    const suspicious = collectSuspiciousReads(
                        scope,
                        checker,
                        signalNodeMap,
                        estreeNodeMap,
                        program,
                    );

                    const {reads: trackedReads} = collectSignalUsages(
                        scope.callback,
                        checker,
                        signalNodeMap,
                        program,
                    );

                    const suspiciousReads = new Set(suspicious.map(({read}) => read));

                    for (const {aliases, consumers, read} of suspicious) {
                        const hasTrackedDependency = consumers.some((consumer) =>
                            trackedReads.some(
                                (trackedRead) =>
                                    !suspiciousReads.has(trackedRead) &&
                                    !isNodeInside(trackedRead, consumer),
                            ),
                        );

                        const hasExternalAliasUsage = aliases.some((alias) =>
                            aliasHasExternalUsage(
                                alias,
                                consumers,
                                scope,
                                checker,
                                signalNodeMap,
                            ),
                        );

                        if (!hasTrackedDependency || hasExternalAliasUsage) {
                            continue;
                        }

                        context.report({
                            data: {kind: scope.kind, name: sourceCode.getText(read)},
                            fix: buildFix(read),
                            messageId: 'incidentalRead',
                            node: read,
                        });
                    }
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Suggest wrapping likely-incidental signal reads with `untracked()` when they are used only as snapshot values in reactive callbacks that already have another tracked dependency, such as writable-signal writes or DOM side-effect calls',
            url: ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
        },
        fixable: 'code',
        messages: {
            incidentalRead:
                '`{{ name }}` looks like an incidental signal read inside `{{ kind }}`. If it is only providing a snapshot value and should not trigger a re-run, wrap it with `untracked()`. See Angular guide: https://angular.dev/guide/signals#reading-without-tracking-dependencies',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'prefer-untracked-incidental-signal-reads',
});

export default rule;
