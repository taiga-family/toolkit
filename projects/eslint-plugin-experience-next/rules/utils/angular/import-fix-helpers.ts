import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import {type RuleFixer, type SourceCode} from '@typescript-eslint/utils/ts-eslint';

import {
    findAngularCoreImportSpecifier,
    findRuntimeAngularCoreImport,
    getLocalNameForImport,
} from './angular-imports';

/** Returns the local alias for `untracked` from `@angular/core`, or null if not imported. */
export function findUntrackedAlias(program: TSESTree.Program): string | null {
    return getLocalNameForImport(program, '@angular/core', 'untracked');
}

/**
 * Builds fixer actions that add `untracked` to an existing `@angular/core` import,
 * or insert a new import declaration when none exists.
 */
export function buildUntrackedImportFixes(
    program: TSESTree.Program,
    fixer: RuleFixer,
): Array<ReturnType<RuleFixer['insertTextBefore']>> {
    const coreImport = findRuntimeAngularCoreImport(program);

    if (!coreImport) {
        const firstStatement = program.body[0];

        if (!firstStatement) {
            return [];
        }

        return [
            fixer.insertTextBefore(
                firstStatement,
                "import { untracked } from '@angular/core';\n",
            ),
        ];
    }

    const namedSpecifiers = coreImport.specifiers.filter(
        (specifier): specifier is TSESTree.ImportSpecifier =>
            specifier.type === AST_NODE_TYPES.ImportSpecifier,
    );

    if (namedSpecifiers.length > 0) {
        const lastNamedSpecifier = namedSpecifiers[namedSpecifiers.length - 1];

        if (!lastNamedSpecifier) {
            return [];
        }

        return [fixer.insertTextAfter(lastNamedSpecifier, ', untracked')];
    }

    const defaultImport = coreImport.specifiers.find(
        (specifier) => specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
    );

    if (defaultImport) {
        return [fixer.insertTextAfter(defaultImport, ', { untracked }')];
    }

    return [
        fixer.insertTextAfter(coreImport, "\nimport { untracked } from '@angular/core';"),
    ];
}

/**
 * Removes the `untracked` import specifier from `@angular/core`.
 * When it is the last specifier, removes the entire declaration.
 */
export function buildImportRemovalFixes(
    program: TSESTree.Program,
    fixer: RuleFixer,
    sourceCode: SourceCode,
): Array<ReturnType<RuleFixer['remove']>> {
    const match = findAngularCoreImportSpecifier(program, 'untracked');

    if (!match) {
        return [];
    }

    const {importDecl, specifier: untrackedSpec} = match;
    const namedSpecifiers = importDecl.specifiers.filter(
        (s): s is TSESTree.ImportSpecifier => s.type === AST_NODE_TYPES.ImportSpecifier,
    );

    if (importDecl.specifiers.length === 1) {
        return [fixer.remove(importDecl)];
    }

    const importText = sourceCode.getText(importDecl);
    const importStart = importDecl.range[0];
    const specStart = untrackedSpec.range[0];
    const specEnd = untrackedSpec.range[1];

    // Try to remove a trailing comma
    const textAfter = importText.slice(specEnd - importStart);
    const trailingComma = /^(\s*,)/.exec(textAfter);
    const [matchedTrailingComma] = trailingComma ?? [];

    if (matchedTrailingComma) {
        return [fixer.removeRange([specStart, specEnd + matchedTrailingComma.length])];
    }

    // Try to remove a leading comma (last specifier)
    const textBefore = importText.slice(0, specStart - importStart);
    const leadingCommaIdx = textBefore.lastIndexOf(',');

    if (leadingCommaIdx !== -1) {
        return [fixer.removeRange([importStart + leadingCommaIdx, specEnd])];
    }

    if (namedSpecifiers.length === 1) {
        return [fixer.remove(untrackedSpec)];
    }

    return [fixer.remove(untrackedSpec)];
}
