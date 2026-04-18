import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {intersect} from './utils/collections/intersect';
import {getFieldTypes} from './utils/typescript/get-field-types';
import {getTypeAwareRuleContext} from './utils/typescript/type-aware-context';

export interface RuleConfig {
    fieldNames: string[];
    newFieldName: string;
    withTypesSpecifier: string[];
}

const createRule = ESLintUtils.RuleCreator((name) => name);

export default createRule<[RuleConfig[]], 'invalidName'>({
    create(context, [configs]) {
        const {checker: typeChecker, esTreeNodeToTSNodeMap} =
            getTypeAwareRuleContext(context);
        const flatConfig = configs.flat();

        return {
            PropertyDefinition(node: TSESTree.PropertyDefinition) {
                const fieldName =
                    node.key.type === AST_NODE_TYPES.Identifier ? node.key.name : null;

                if (!fieldName) {
                    return;
                }

                const tsNode = esTreeNodeToTSNodeMap.get(node);
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
    meta: {
        defaultOptions: [[]],
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
