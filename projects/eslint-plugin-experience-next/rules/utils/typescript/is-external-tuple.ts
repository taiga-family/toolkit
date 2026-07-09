import {type Type, type TypeChecker, type TypeReference} from 'typescript';

import {isClassType} from './is-class-type';

export function isExternalPureTuple(typeChecker: TypeChecker, type: Type): boolean {
    const typeText = typeChecker.typeToString(type);

    const isTuple =
        typeChecker.isTupleType(type) ||
        typeText.startsWith('readonly [') ||
        typeText.startsWith('[');

    if (!isTuple) {
        return false;
    }

    const typeRef = type as TypeReference;
    const typeArgs = typeChecker.getTypeArguments(typeRef);

    return typeArgs.length > 0
        ? typeArgs.every(
              (item) =>
                  isClassType(item) ||
                  typeChecker.typeToString(item).startsWith('typeof '),
          )
        : false;
}
