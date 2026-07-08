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

    if (typeArgs.length > 0) {
        return typeArgs.every(
            (item) =>
                isClassType(item) || typeChecker.typeToString(item).startsWith('typeof '),
        );
    }

    const tupleContent = typeText.replace(/^readonly\s+\[/, '').replace(/\]$/, '');
    const tupleElements = tupleContent.split(',').map((item) => item.trim());

    return (
        tupleElements.length > 0 &&
        tupleElements.every((item) => item.startsWith('typeof '))
    );
}
