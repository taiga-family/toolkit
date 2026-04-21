import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import {isCallExpression} from 'typescript';

import {createRule} from '../utils/create-rule';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type Options = [
    {
        ignoreTupleContextualTyping?: boolean;
    }?,
];

type MessageId = 'redundantTypeAnnotation';

function collectArrayExpressions(node: TSESTree.Node): TSESTree.ArrayExpression[] {
    const result: TSESTree.ArrayExpression[] = [];

    if (node.type === AST_NODE_TYPES.ArrayExpression) {
        result.push(node);
    }

    switch (node.type) {
        case AST_NODE_TYPES.BinaryExpression:
        case AST_NODE_TYPES.LogicalExpression:
            result.push(...collectArrayExpressions(node.left));
            result.push(...collectArrayExpressions(node.right));
            break;
        case AST_NODE_TYPES.ConditionalExpression:
            result.push(...collectArrayExpressions(node.consequent));
            result.push(...collectArrayExpressions(node.alternate));
            break;
        case AST_NODE_TYPES.ObjectExpression:
            for (const property of node.properties) {
                if (property.type === AST_NODE_TYPES.Property) {
                    result.push(...collectArrayExpressions(property.value));
                }
            }

            break;
        default:
            break;
    }

    return result;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {checker: typeChecker, esTreeNodeToTSNodeMap} =
            getTypeAwareRuleContext(context);
        const ignoreTupleContextualTyping =
            context.options[0]?.ignoreTupleContextualTyping ?? true;

        function check(
            node: TSESTree.PropertyDefinition | TSESTree.VariableDeclarator,
            typeAnnotation: TSESTree.TSTypeAnnotation | null | undefined,
            value: TSESTree.Expression | null | undefined,
        ): void {
            if (!typeAnnotation || !value) {
                return;
            }

            const tsNode = esTreeNodeToTSNodeMap.get(node);
            const tsValueNode = esTreeNodeToTSNodeMap.get(value);
            const declaredType = typeChecker.getTypeAtLocation(tsNode);
            const inferredType = typeChecker.getTypeAtLocation(tsValueNode);

            if (
                typeChecker.typeToString(declaredType) !==
                typeChecker.typeToString(inferredType)
            ) {
                return;
            }

            // If the initializer is a function expression or arrow function without
            // its own return type annotation, the variable annotation may be the
            // only explicit return type declaration (satisfying
            // @typescript-eslint/explicit-function-return-type via
            // allowTypedFunctionExpressions). Removing it would break that rule.
            if (
                (value.type === AST_NODE_TYPES.ArrowFunctionExpression ||
                    value.type === AST_NODE_TYPES.FunctionExpression) &&
                !value.returnType
            ) {
                return;
            }

            // If the annotation provides contextual typing that narrows an array
            // literal to a tuple (e.g. [0, 0] → readonly [number, number]), removing
            // it would widen the inferred type. This covers both direct array literals
            // and arrays nested inside object literals or conditional expressions.
            if (ignoreTupleContextualTyping) {
                const arrayExpressions = collectArrayExpressions(value);

                for (const arrayExpression of arrayExpressions) {
                    const tsArrayNode = esTreeNodeToTSNodeMap.get(arrayExpression);

                    if (
                        typeChecker.isTupleType(
                            typeChecker.getTypeAtLocation(tsArrayNode),
                        )
                    ) {
                        return;
                    }
                }
            }

            // If the initializer is a call to a generic function with no explicit
            // type arguments, the type parameters may be inferred from the
            // contextual return type provided by this annotation. Removing the
            // annotation could change the inferred type (e.g., T → unknown).
            if (isCallExpression(tsValueNode) && !tsValueNode.typeArguments?.length) {
                const sig = typeChecker.getResolvedSignature(tsValueNode);
                const decl = sig?.declaration;

                if (decl && 'typeParameters' in decl && decl.typeParameters?.length) {
                    return;
                }
            }

            context.report({
                fix(fixer) {
                    return fixer.remove(typeAnnotation);
                },
                messageId: 'redundantTypeAnnotation',
                node: typeAnnotation,
            });
        }

        return {
            PropertyDefinition(node: TSESTree.PropertyDefinition) {
                check(node, node.typeAnnotation, node.value);
            },
            VariableDeclarator(node: TSESTree.VariableDeclarator) {
                if (node.id.type !== AST_NODE_TYPES.Identifier) {
                    return;
                }

                check(node, node.id.typeAnnotation, node.init);
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow redundant type annotations when the type is already inferred from the initializer',
        },
        fixable: 'code',
        messages: {
            redundantTypeAnnotation:
                'Type annotation is redundant — the type is already inferred from the initializer',
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    ignoreTupleContextualTyping: {
                        description:
                            'Preserve annotations when they provide contextual typing that narrows an array literal to a tuple type. Defaults to true.',
                        type: 'boolean',
                    },
                },
                type: 'object',
            },
        ],
        type: 'suggestion',
    },
    name: 'no-redundant-type-annotation',
});

export default rule;
