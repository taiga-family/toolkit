import ts from 'typescript';

export function isClassType(type: ts.Type): boolean {
    const symbol = type.getSymbol();

    if (!symbol) {
        return false;
    }

    return (
        symbol
            .getDeclarations()
            ?.some((d) => ts.isClassDeclaration(d) || ts.isClassExpression(d)) ?? false
    );
}
