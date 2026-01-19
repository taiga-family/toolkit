import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
    create(context) {
        const checkImplicitPublic = (node: any): void => {
            const classRef = getClass(node);

            if (!classRef || node.kind === 'constructor' || !!node?.accessibility) {
                return;
            }

            if (node.key?.type === AST_NODE_TYPES.PrivateIdentifier) {
                return;
            }

            const name =
                node?.key?.name ||
                node?.parameter?.name ||
                (node?.key?.type === 'Identifier' ? node.key.name : 'member');

            let range = node?.parameter?.range ??
                node?.key?.range ??
                node?.range ?? [0, 0];

            if (node.kind === 'set' || node.kind === 'get') {
                const [start, end] = node.key.range;

                range = [start - node.kind.length - 1, end - node.kind.length - 1];
            } else if (node.kind === 'method' && node.key?.object?.name === 'Symbol') {
                const [start, end] = range;

                range = [start - 1, end - 1];
            }

            if (node.type === 'PropertyDefinition' && node.decorators?.length > 0) {
                const [, end] = node.decorators[node.decorators.length - 1].range ?? [];

                range = [end + 1, end + 2];
            }

            context.report({
                data: {
                    kind: node.kind || 'property',
                    name,
                },
                fix: (fixer) => fixer.insertTextBeforeRange(range, ' public '),
                messageId: 'implicitPublic',
                node,
            });
        };

        return {
            MethodDefinition(node: TSESTree.MethodDefinition) {
                checkImplicitPublic(node);
            },
            PropertyDefinition(node: TSESTree.PropertyDefinition) {
                checkImplicitPublic(node);
            },
            TSParameterProperty(node: TSESTree.TSParameterProperty) {
                checkImplicitPublic(node);
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                'Require explicit `public` modifier for class members and parameter properties',
        },
        fixable: 'code',
        messages: {implicitPublic: '{{kind}} {{name}} should be marked as public'},
        schema: [],
        type: 'problem',
    },
    name: 'explicit-public-member',
});

function getClass(
    node: TSESTree.Node | null | undefined,
): TSESTree.ClassDeclaration | null {
    if (!node) {
        return null;
    }

    if (node.type === AST_NODE_TYPES.ClassDeclaration) {
        return node;
    }

    return getClass(node.parent);
}

export default rule;
