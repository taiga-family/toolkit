import {type InterfaceType, type Type, type TypeChecker, TypeFlags} from 'typescript';

const NULLISH_TYPE_FLAGS = TypeFlags.Null | TypeFlags.Undefined | TypeFlags.Void;

function getIntrinsicName(type: Type): string | null {
    const {intrinsicName} = type as unknown as Record<'intrinsicName', unknown>;

    return typeof intrinsicName === 'string' ? intrinsicName : null;
}

function getUnionTypes(type: Type): readonly Type[] | null {
    if (type.isUnion()) {
        return type.types;
    }

    const {types} = type as unknown as Record<'types', unknown>;

    return Array.isArray(types) ? (types as readonly Type[]) : null;
}

export function isAnyOrUnknownType(type: Type): boolean {
    const intrinsicName = getIntrinsicName(type);

    return (
        (type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0 ||
        intrinsicName === 'any' ||
        intrinsicName === 'unknown'
    );
}

export function isInterfaceType(type: Type): type is InterfaceType {
    return 'getBaseTypes' in type && typeof type.getBaseTypes === 'function';
}

export function isNullishType(type: Type): boolean {
    const intrinsicName = getIntrinsicName(type);

    return (
        (type.flags & NULLISH_TYPE_FLAGS) !== 0 ||
        intrinsicName === 'null' ||
        intrinsicName === 'undefined' ||
        intrinsicName === 'void'
    );
}

export function hasNullishType(type: Type): boolean {
    const unionTypes = getUnionTypes(type);

    return unionTypes ? unionTypes.some(hasNullishType) : isNullishType(type);
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
