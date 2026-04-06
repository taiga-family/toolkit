import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

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
