import ts from 'typescript';

export function isClassType(type: ts.Type): boolean {
    const symbol = type.getSymbol();

    return symbol
        ? (symbol
              .getDeclarations()
              ?.some(
                  (declaration) =>
                      declaration.kind === ts.SyntaxKind.ClassDeclaration ||
                      declaration.kind === ts.SyntaxKind.ClassExpression,
              ) ?? false)
        : false;
}
