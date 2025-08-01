import type {TSESTree} from '@typescript-eslint/utils';
import {AST_NODE_TYPES, ESLintUtils} from '@typescript-eslint/utils';
import type ts from 'typescript';

type RuleConfig = ReadonlyArray<{
    property: string;
    whenTypeIs: string[];
}>;

const createRule = ESLintUtils.RuleCreator((name) => name);

export default createRule<[RuleConfig[]], 'invalidName'>({
    create(context, [configs]) {
        const parserServices = ESLintUtils.getParserServices(context);
        const typeChecker = parserServices.program.getTypeChecker();
        const flatConfig = configs.flat();

        return {
            PropertyDefinition(node: TSESTree.PropertyDefinition) {
                const fieldName =
                    node.key.type === AST_NODE_TYPES.Identifier ? node.key.name : null;

                if (!fieldName) {
                    return;
                }

                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
                const fieldType = typeChecker.getTypeAtLocation(tsNode);
                const typeName = getTypeName(fieldType);

                const rule = flatConfig.find((rule) =>
                    rule.whenTypeIs.some((type) => typeName?.includes(type)),
                );

                if (!rule || fieldName === rule.property) {
                    return;
                }

                context.report({
                    data: {
                        currentName: fieldName,
                        expectedName: rule.property,
                        typeName: typeName || 'unknown',
                    },
                    fix(fixer) {
                        return fixer.replaceText(node.key, rule.property);
                    },
                    messageId: 'invalidName',
                    node,
                });
            },
        };
    },
    defaultOptions: [[]],
    meta: {
        docs: {
            description:
                'Enforce custom naming for class properties based on their type.',
        },
        fixable: 'code',
        messages: {
            invalidName:
                'Property `{{ currentName }}` must be renamed to `{{ expectedName }}` for type `{{ typeName }}`.',
        },
        schema: [
            {
                items: {
                    items: {
                        additionalProperties: false,
                        properties: {
                            property: {type: 'string'},
                            whenTypeIs: {items: {type: 'string'}, type: 'array'},
                        },
                        type: 'object',
                    },
                    type: 'array',
                },
                type: 'array',
            },
        ],
        type: 'suggestion',
    },
    name: 'class-property-naming',
});

function getTypeName(type: ts.Type): string | null {
    return (type.getSymbol() || type.aliasSymbol)?.getName() ?? null;
}
