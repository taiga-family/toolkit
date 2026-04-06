import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import {isCallExpression} from 'typescript';

const createRule = ESLintUtils.RuleCreator((name) => name);

type Options = [];

type MessageId = 'redundantTypeAnnotation';

export const rule = createRule<Options, MessageId>({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const typeChecker = parserServices.program.getTypeChecker();

        function check(
            node: TSESTree.PropertyDefinition | TSESTree.VariableDeclarator,
            typeAnnotation: TSESTree.TSTypeAnnotation | null | undefined,
            value: TSESTree.Expression | null | undefined,
        ): void {
            if (!typeAnnotation || !value) {
                return;
            }

            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const tsValueNode = parserServices.esTreeNodeToTSNodeMap.get(value);
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
        schema: [],
        type: 'suggestion',
    },
    name: 'no-redundant-type-annotation',
});

export default rule;
