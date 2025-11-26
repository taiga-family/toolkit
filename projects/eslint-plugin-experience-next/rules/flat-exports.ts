import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {getConstArray} from './utils/get-const-array';
import {isClassType} from './utils/is-class-type';
import {isExternalPureTuple} from './utils/is-external-tuple';

const createRule = ESLintUtils.RuleCreator((name) => name);

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

export default createRule<[], typeof MESSAGE_ID>({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const typeChecker = parserServices.program.getTypeChecker();
        const arrays = new Map<string, ArrayMeta>();
        const purityCache = new WeakMap<ArrayMeta, boolean>();

        const isPureArray = (arr: ArrayMeta): boolean => {
            if (purityCache.has(arr)) {
                return purityCache.get(arr)!;
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

                    arr.elements.forEach((meta, index) => {
                        if (!meta.isArrayLike) {
                            return;
                        }

                        const elementNode = arr.node.elements[index];

                        if (
                            !elementNode ||
                            elementNode.type !== AST_NODE_TYPES.Identifier
                        ) {
                            return;
                        }

                        const hasLocalArrayMeta = arrays.has(meta.name);
                        const isExternalPure = !hasLocalArrayMeta
                            ? isExternalPureTuple(typeChecker, meta.type)
                            : false;

                        if (!hasLocalArrayMeta && !isExternalPure) {
                            return;
                        }

                        context.report({
                            data: {name: meta.name},
                            fix(fixer) {
                                return fixer.replaceText(elementNode, `...${meta.name}`);
                            },
                            messageId: MESSAGE_ID,
                            node: elementNode,
                        });
                    });
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
                    if (!el || el.type !== AST_NODE_TYPES.Identifier) {
                        isDirty = true;
                        continue;
                    }

                    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(el);
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
    defaultOptions: [],
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
