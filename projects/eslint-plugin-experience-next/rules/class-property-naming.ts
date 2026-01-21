import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {getFieldTypes} from './utils/get-field-types';
import {intersect} from './utils/intersect';

export interface RuleConfig {
    fieldNames: string[];
    newFieldName: string;
    withTypesSpecifier: string[];
}

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
                const nodeType = typeChecker.getTypeAtLocation(tsNode);
                const fieldTypes = getFieldTypes(nodeType, typeChecker);

                const rule = flatConfig.find(
                    (rule) =>
                        intersect(fieldTypes, rule.withTypesSpecifier) &&
                        rule.fieldNames.includes(fieldName),
                );

                if (!rule) {
                    return;
                }

                context.report({
                    data: {
                        currentName: fieldName,
                        expectedName: rule.newFieldName,
                    },
                    fix(fixer) {
                        return fixer.replaceText(node.key, rule.newFieldName);
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
                'Property `{{ currentName }}` must be renamed to `{{ expectedName }}`',
        },
        schema: [
            {
                items: {
                    additionalProperties: false,
                    properties: {
                        fieldNames: {
                            items: {type: 'string'},
                            type: 'array',
                        },
                        newFieldName: {type: 'string'},
                        withTypesSpecifier: {
                            items: {type: 'string'},
                            type: 'array',
                        },
                    },
                    type: 'object',
                },
                type: 'array',
            },
        ],
        type: 'suggestion',
    },
    name: 'class-property-naming',
});
