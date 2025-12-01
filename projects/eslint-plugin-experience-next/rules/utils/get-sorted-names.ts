import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {isSpread} from './is-spread';
import {nameOf} from './name-of';

/**
 * Sorts Angular standalone import elements into a deterministic, alphabetical order.
 *
 * The sorting rules:
 * 1. Regular elements (Identifiers, MemberExpressions, etc.) are sorted alphabetically.
 * 2. Spread elements (e.g. `...A`) are sorted separately and placed after regular ones.
 * 3. Sorting is based on the string value returned by `nameOf()`.
 *
 * @example
 * // Input:
 * [B, ...Z, A]
 *
 * // Output:
 * ["A", "B", "...Z"]
 *
 * @param elements - Raw AST elements from the `imports: [...]` array.
 * @param source   - ESLint SourceCode object used to extract text for complex expressions.
 *
 * @returns A list of sorted element names, ready to be joined into a fixed array.
 */
export function getSortedNames(
    elements: Array<TSESTree.Expression | TSESTree.SpreadElement>,
    source: Readonly<TSESLint.SourceCode>,
): string[] {
    const regular = elements.filter((e) => !isSpread(e));
    const spreads = elements.filter((e) => isSpread(e));

    const sortedRegular = [...regular].sort((a, b) =>
        nameOf(a, source).localeCompare(nameOf(b, source)),
    );

    const sortedSpreads = [...spreads].sort((a, b) =>
        nameOf(a.argument, source).localeCompare(nameOf(b.argument, source)),
    );

    return [...sortedRegular, ...sortedSpreads].map((n) => nameOf(n, source));
}
