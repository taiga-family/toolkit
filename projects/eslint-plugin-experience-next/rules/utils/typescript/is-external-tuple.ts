import {type Type, type TypeChecker, type TypeReference} from 'typescript';

import {isClassType} from './is-class-type';

export function isExternalPureTuple(typeChecker: TypeChecker, type: Type): boolean {
    if (!typeChecker.isTupleType(type)) {
        return false;
    }

    const typeRef = type as TypeReference;
    const typeArgs = typeChecker.getTypeArguments(typeRef);

    return typeArgs.length === 0 ? false : typeArgs.every((item) => isClassType(item));
}
