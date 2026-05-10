const IDENTIFIER = /^[A-Z_$][\w$]*$/i;

const RESERVED_IDENTIFIERS = new Set([
    'arguments',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'eval',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'implements',
    'import',
    'in',
    'instanceof',
    'interface',
    'let',
    'new',
    'null',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'undefined',
    'var',
    'void',
    'while',
    'with',
    'yield',
]);

export function isIdentifier(name: string): boolean {
    return IDENTIFIER.test(name) && !RESERVED_IDENTIFIERS.has(name);
}

export function getAvailableIdentifier(
    baseName: string,
    unavailableNames: ReadonlySet<string>,
): string {
    if (!isIdentifier(baseName)) {
        throw new Error(`Expected a valid identifier, got "${baseName}"`);
    }

    if (!unavailableNames.has(baseName)) {
        return baseName;
    }

    let suffix = 2;
    let name = `${baseName}${suffix}`;

    while (unavailableNames.has(name)) {
        suffix++;
        name = `${baseName}${suffix}`;
    }

    return name;
}
