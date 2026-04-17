import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import {
    type RuleFix,
    type RuleFixer,
    type SourceCode,
} from '@typescript-eslint/utils/ts-eslint';

const MESSAGE_ID = 'invalid-injection-token-description' as const;
const ERROR_MESSAGE = "InjectionToken's description should contain token's name";
const NG_DEV_MODE = 'ngDevMode' as const;

const createRule = ESLintUtils.RuleCreator((name) => name);

type StringDescriptionNode = TSESTree.Literal & {value: string};

type StringLikeNode = StringDescriptionNode | TSESTree.TemplateLiteral;

function getVariableName(node: TSESTree.NewExpression): string | undefined {
    if (node.parent.type !== AST_NODE_TYPES.VariableDeclarator) {
        return undefined;
    }

    const {id} = node.parent;

    return id.type === AST_NODE_TYPES.Identifier ? id.name : undefined;
}

function isStringLiteral(node: TSESTree.Expression): node is StringDescriptionNode {
    return node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string';
}

function isStringLike(node: TSESTree.Expression): node is StringLikeNode {
    return isStringLiteral(node) || node.type === AST_NODE_TYPES.TemplateLiteral;
}

function getStringValue(node: StringLikeNode): string {
    if (isStringLiteral(node)) {
        return node.value;
    }

    return node.quasis[0]?.value.raw || '';
}

function isEmptyString(node: StringLikeNode): boolean {
    return (
        getStringValue(node) === '' &&
        (!('expressions' in node) || !node.expressions.length)
    );
}

function isNgDevModeConditional(
    node: TSESTree.Expression,
): node is TSESTree.ConditionalExpression & {
    alternate: StringLikeNode;
    consequent: StringLikeNode;
    test: TSESTree.Identifier;
} {
    return (
        node.type === AST_NODE_TYPES.ConditionalExpression &&
        node.test.type === AST_NODE_TYPES.Identifier &&
        node.test.name === NG_DEV_MODE &&
        isStringLike(node.consequent) &&
        isStringLike(node.alternate) &&
        isEmptyString(node.alternate)
    );
}

function getDescriptionValue(node: TSESTree.Expression): string | undefined {
    if (isStringLike(node)) {
        return getStringValue(node);
    }

    if (isNgDevModeConditional(node)) {
        return getStringValue(node.consequent);
    }

    return undefined;
}

function getDescriptionNode(node: TSESTree.Expression): StringLikeNode | undefined {
    if (isStringLike(node)) {
        return node;
    }

    return isNgDevModeConditional(node) ? node.consequent : undefined;
}

function prependTokenName(text: string, name: string): string {
    return `${text.slice(0, 1)}[${name}]: ${text.slice(1)}`;
}

function isNgDevModeVisible(sourceCode: SourceCode, node: TSESTree.Node): boolean {
    for (
        let scope: ReturnType<SourceCode['getScope']> | null = sourceCode.getScope(node);
        scope !== null;
        scope = scope.upper
    ) {
        if (scope.variables.some((variable) => variable.name === NG_DEV_MODE)) {
            return true;
        }
    }

    return false;
}

function getNgDevModeDeclarationFix(
    program: TSESTree.Program,
    fixer: RuleFixer,
): RuleFix {
    const lastImport = [...program.body]
        .reverse()
        .find((statement) => statement.type === AST_NODE_TYPES.ImportDeclaration);

    if (lastImport) {
        return fixer.insertTextAfter(lastImport, '\n\ndeclare const ngDevMode: boolean;');
    }

    const [firstStatement] = program.body;

    if (firstStatement) {
        return fixer.insertTextBefore(
            firstStatement,
            'declare const ngDevMode: boolean;\n\n',
        );
    }

    return fixer.insertTextBeforeRange([0, 0], 'declare const ngDevMode: boolean;\n');
}

export const rule = createRule({
    create(context) {
        const {sourceCode} = context;
        const program = sourceCode.ast as TSESTree.Program;
        let shouldAddNgDevModeDeclaration = true;

        return {
            'NewExpression[callee.name="InjectionToken"]'(node: TSESTree.NewExpression) {
                const [description] = node.arguments;

                if (!description || description.type === AST_NODE_TYPES.SpreadElement) {
                    return;
                }

                const name = getVariableName(node);
                const token = getDescriptionValue(description);
                const fixedDescription = getDescriptionNode(description);

                const report = name && token && !token.includes(name);

                if (report && fixedDescription) {
                    context.report({
                        fix: (fixer) => {
                            const isNgDevModeGuarded =
                                isNgDevModeConditional(description);
                            const fixes = [
                                fixer.replaceText(
                                    isNgDevModeGuarded ? fixedDescription : description,
                                    isNgDevModeGuarded
                                        ? prependTokenName(
                                              sourceCode.getText(fixedDescription),
                                              name,
                                          )
                                        : `${NG_DEV_MODE} ? ${prependTokenName(sourceCode.getText(fixedDescription), name)} : ''`,
                                ),
                            ];

                            if (
                                !isNgDevModeGuarded &&
                                shouldAddNgDevModeDeclaration &&
                                !isNgDevModeVisible(sourceCode, description)
                            ) {
                                shouldAddNgDevModeDeclaration = false;
                                fixes.unshift(getNgDevModeDeclarationFix(program, fixer));
                            }

                            return fixes;
                        },
                        messageId: MESSAGE_ID,
                        node: description,
                    });
                }
            },
        };
    },
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [],
        type: 'problem',
    },
    name: 'injection-token-description',
});

export default rule;
