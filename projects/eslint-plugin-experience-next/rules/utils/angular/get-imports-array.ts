import {type TSESTree} from '@typescript-eslint/utils';

import {isImportsArrayProperty} from './is-imports-array-property';

export function getImportsArray(
    meta: TSESTree.ObjectExpression,
): TSESTree.ArrayExpression | null {
    const property = meta.properties.find(isImportsArrayProperty);

    return property?.value ?? null;
}
