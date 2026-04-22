import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {getConstArray} from '../utils/ast/get-const-array';
import {createRule} from '../utils/create-rule';
import {isClassType} from '../utils/typescript/is-class-type';
import {isExternalPureTuple} from '../utils/typescript/is-external-tuple';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

const MESSAGE_ID = 'spreadArrays' as const;

interface ElementMeta {
    name: string;
    isClass: boolean;
    isArrayLike: boolean;
    type: ts.Type;
}

interface ArrayMeta {
    node: TSESTree.ArrayExpression;
    elements: readonly ElementMeta[];
    isDirty: boolean;
}

export const rule = createRule<[], typeof MESSAGE_ID>({
    create(context) {
        const {checker: typeChecker, esTreeNodeToTSNodeMap} =
            getTypeAwareRuleContext(context);

        const arrays = new Map<string, ArrayMeta>();
        const purityCache = new WeakMap<ArrayMeta, boolean>();

        const isPureArray = (arr: ArrayMeta): boolean => {
            const cachedPurity = purityCache.get(arr);

            if (cachedPurity != null) {
                return cachedPurity;
            }

            if (arr.isDirty) {
                purityCache.set(arr, false);

                return false;
            }

            for (const el of arr.elements) {
                if (el.isClass) {
                    continue;
                }

                if (el.isArrayLike) {
                    const nested = arrays.get(el.name);

                    if (nested) {
                        if (!isPureArray(nested)) {
                            purityCache.set(arr, false);

                            return false;
                        }

                        continue;
                    }

                    if (isExternalPureTuple(typeChecker, el.type)) {
                        continue;
                    }

                    purityCache.set(arr, false);

                    return false;
                }

                purityCache.set(arr, false);

                return false;
            }

            purityCache.set(arr, true);

            return true;
        };

        return {
            'Program:exit'() {
                for (const [, arr] of arrays) {
                    if (!isPureArray(arr)) {
                        continue;
                    }

                    for (const [index, meta] of arr.elements.entries()) {
                        if (!meta.isArrayLike) {
                            continue;
                        }

                        const elementNode = arr.node.elements[index];

                        if (elementNode?.type !== AST_NODE_TYPES.Identifier) {
                            continue;
                        }

                        const hasLocalArrayMeta = arrays.has(meta.name);

                        const isExternalPure = hasLocalArrayMeta
                            ? false
                            : isExternalPureTuple(typeChecker, meta.type);

                        if (!hasLocalArrayMeta && !isExternalPure) {
                            continue;
                        }

                        context.report({
                            data: {name: meta.name},
                            fix(fixer) {
                                return fixer.replaceText(elementNode, `...${meta.name}`);
                            },
                            messageId: MESSAGE_ID,
                            node: elementNode,
                        });
                    }
                }
            },

            VariableDeclarator(node) {
                if (node.id.type !== AST_NODE_TYPES.Identifier) {
                    return;
                }

                const name = node.id.name;
                const arrayExpression = getConstArray(node.init);

                if (!arrayExpression) {
                    return;
                }

                const elements: ElementMeta[] = [];
                let isDirty = false;

                for (const el of arrayExpression.elements) {
                    if (el?.type !== AST_NODE_TYPES.Identifier) {
                        isDirty = true;
                        continue;
                    }

                    const tsNode = esTreeNodeToTSNodeMap.get(el);
                    const elType = typeChecker.getTypeAtLocation(tsNode);
                    const isClass = isClassType(elType);

                    const isArrayLike =
                        typeChecker.isArrayLikeType(elType) ||
                        typeChecker.isTupleType(elType);

                    elements.push({
                        isArrayLike,
                        isClass,
                        name: el.name,
                        type: elType,
                    });

                    if (!isClass && !isArrayLike) {
                        isDirty = true;
                    }
                }

                arrays.set(name, {
                    elements,
                    isDirty,
                    node: arrayExpression,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Ensure exported const tuples contain spread arrays in pure entity chains.',
        },
        fixable: 'code',
        messages: {
            [MESSAGE_ID]:
                'Spread "{{ name }}" to avoid nested arrays in exported entities.',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'flat-exports',
});

export default rule;
