import ts, {type TypeChecker} from 'typescript';

export function getFieldTypes(type: ts.Type, checker: TypeChecker): string[] {
    const typeNames: string[] = [];

    if (type.isUnionOrIntersection()) {
        for (const subtype of type.types) {
            typeNames.push(...getFieldTypes(subtype, checker));
        }

        return typeNames;
    }

    if (type.flags & ts.TypeFlags.Undefined) {
        typeNames.push('undefined');
    } else if (type.flags & ts.TypeFlags.Null) {
        typeNames.push('null');
    } else if (type.flags & ts.TypeFlags.Unknown) {
        typeNames.push('unknown');
    } else if (type.flags & ts.TypeFlags.String) {
        typeNames.push('string');
    } else {
        const symbol = type.getSymbol() || type.aliasSymbol;

        if (symbol) {
            typeNames.push(symbol.getName());
        } else {
            typeNames.push(checker.typeToString(type));
        }
    }

    return typeNames;
}
