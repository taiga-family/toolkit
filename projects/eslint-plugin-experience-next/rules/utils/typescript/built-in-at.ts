import {type Type, type TypeChecker} from 'typescript';

import {isAnyOrUnknownType, isInterfaceType, isNullishType} from './types';

const BUILT_IN_AT_RECEIVER_NAMES = new Set([
    'Array',
    'BigInt64Array',
    'BigUint64Array',
    'Float32Array',
    'Float64Array',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'ReadonlyArray',
    'String',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
]);

export function hasBuiltInAtReceiverType(
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
                hasBuiltInAtReceiverType(typeChecker, item, visitedTypes),
            )
        );
    }

    if (type.isIntersection()) {
        return type.types.some((item) =>
            hasBuiltInAtReceiverType(typeChecker, item, visitedTypes),
        );
    }

    const apparentType = typeChecker.getApparentType(type);

    if (typeChecker.isArrayType(apparentType) || typeChecker.isTupleType(apparentType)) {
        return true;
    }

    const symbolName = apparentType.getSymbol()?.getName();

    const hasBuiltInAtReceiverSymbol =
        symbolName !== undefined && BUILT_IN_AT_RECEIVER_NAMES.has(symbolName);

    if (hasBuiltInAtReceiverSymbol) {
        return true;
    }

    return isInterfaceType(apparentType)
        ? (apparentType.getBaseTypes() ?? []).some((baseType) =>
              hasBuiltInAtReceiverType(typeChecker, baseType, visitedTypes),
          )
        : false;
}
