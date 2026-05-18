import {type InterfaceType, type Type, type TypeChecker, TypeFlags} from 'typescript';

const NULLISH_TYPE_FLAGS = TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void;

export function isAnyOrUnknownType(type: Type): boolean {
    return (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0;
}

export function isInterfaceType(type: Type): type is InterfaceType {
    return 'getBaseTypes' in type && typeof type.getBaseTypes === 'function';
}

export function isNullishType(type: Type): boolean {
    return (type.flags & NULLISH_TYPE_FLAGS) !== 0;
}

export function hasNullishType(type: Type): boolean {
    return type.isUnion() ? type.types.some(hasNullishType) : isNullishType(type);
}

export function isKnownTupleType(
    typeChecker: TypeChecker,
    type: Type,
    visitedTypes = new Set<Type>(),
): boolean {
    const shouldSkipReceiverType = isAnyOrUnknownType(type) || visitedTypes.has(type);

    if (shouldSkipReceiverType) {
        return false;
    }

    visitedTypes.add(type);

    if (type.isUnion()) {
        const definedTypes = type.types.filter((item) => !isNullishType(item));

        return (
            definedTypes.length > 0 &&
            definedTypes.every((item) =>
                isKnownTupleType(typeChecker, item, visitedTypes),
            )
        );
    }

    return type.isIntersection()
        ? type.types.some((item) => isKnownTupleType(typeChecker, item, visitedTypes))
        : typeChecker.isTupleType(type) ||
              typeChecker.isTupleType(typeChecker.getApparentType(type));
}
