import ts from 'typescript';

export function isClassType(type: ts.Type): boolean {
    const symbol = type.getSymbol();

    return symbol
        ? (symbol
              .getDeclarations()
              ?.some((d) => ts.isClassDeclaration(d) || ts.isClassExpression(d)) ?? false)
        : false;
}
