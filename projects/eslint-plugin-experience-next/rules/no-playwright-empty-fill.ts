import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

const createRule = ESLintUtils.RuleCreator((name) => name);

type Options = [];

type MessageId = 'useClear';

export const rule = createRule<Options, MessageId>({
    create(context) {
        const services = ESLintUtils.getParserServices(context);
        const checker = services.program.getTypeChecker();

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

                if (!argument || !isEmptyString(argument)) {
                    return;
                }

                const objectExpression = callee.object;
                const tsNode = services.esTreeNodeToTSNodeMap.get(objectExpression);
                const type = checker.getTypeAtLocation(tsNode);

                if (!isPlaywrightLocator(type, checker)) {
                    return;
                }

                context.report({
                    fix(fixer) {
                        const objectText = context.sourceCode.getText(objectExpression);

                        return fixer.replaceText(node, `${objectText}.clear()`);
                    },
                    messageId: 'useClear',
                    node,
                });
            },
        };
    },

    defaultOptions: [],

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

function isEmptyString(node: TSESTree.Node): boolean {
    return (
        (node.type === AST_NODE_TYPES.Literal && node.value === '') ||
        (node.type === AST_NODE_TYPES.TemplateLiteral &&
            node.expressions.length === 0 &&
            node.quasis.length === 1 &&
            node.quasis[0]?.value.cooked === '')
    );
}

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
