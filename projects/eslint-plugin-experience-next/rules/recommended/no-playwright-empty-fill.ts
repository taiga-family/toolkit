import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {isEmptyStaticString} from '../utils/ast/string-literals';
import {createRule} from '../utils/create-rule';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type Options = [];

type MessageId = 'useClear';

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, sourceCode} =
            getTypeAwareRuleContext(context);

        return {
            CallExpression(node: TSESTree.CallExpression) {
                const callee = node.callee;

                if (callee.type !== AST_NODE_TYPES.MemberExpression) {
                    return;
                }

                const property = callee.property;

                if (
                    property.type !== AST_NODE_TYPES.Identifier ||
                    property.name !== 'fill' ||
                    node.arguments.length !== 1
                ) {
                    return;
                }

                const [argument] = node.arguments;

                if (!argument || !isEmptyStaticString(argument)) {
                    return;
                }

                const objectExpression = callee.object;
                const tsNode = esTreeNodeToTSNodeMap.get(objectExpression);
                const type = checker.getTypeAtLocation(tsNode);

                if (!isPlaywrightLocator(type, checker)) {
                    return;
                }

                context.report({
                    fix(fixer) {
                        const objectText = sourceCode.getText(objectExpression);

                        return fixer.replaceText(node, `${objectText}.clear()`);
                    },
                    messageId: 'useClear',
                    node,
                });
            },
        };
    },

    meta: {
        docs: {
            description:
                "Enforce Playwright clear() instead of fill('') for emptying fields",
        },
        fixable: 'code',
        messages: {useClear: "Use clear() instead of fill('') when emptying a field"},
        schema: [],
        type: 'suggestion',
    },

    name: 'no-playwright-empty-fill',
});

export default rule;

function isPlaywrightLocator(type: ts.Type, checker: ts.TypeChecker): boolean {
    if (isPlaywrightLocatorType(type)) {
        return true;
    }

    const locatorProp = type.getProperty('locator');

    if (!locatorProp) {
        return false;
    }

    const decl = locatorProp.valueDeclaration ?? locatorProp.declarations?.[0];

    if (!decl) {
        return false;
    }

    const locatorType = checker.getTypeOfSymbolAtLocation(locatorProp, decl);

    return isPlaywrightLocatorType(locatorType);
}

function isPlaywrightLocatorType(type: ts.Type): boolean {
    if (type.isUnionOrIntersection()) {
        return type.types.some(isPlaywrightLocatorType);
    }

    const symbol = type.getSymbol() ?? type.aliasSymbol;

    if (symbol?.getName() !== 'Locator') {
        return false;
    }

    const declarations = symbol.getDeclarations() ?? [];

    return declarations.some((decl) => {
        const fileName = decl.getSourceFile().fileName.replaceAll('\\', '/');

        return (
            fileName.includes('/node_modules/playwright/') ||
            fileName.includes('/node_modules/@playwright/test/') ||
            fileName.includes('/node_modules/playwright-core/')
        );
    });
}
