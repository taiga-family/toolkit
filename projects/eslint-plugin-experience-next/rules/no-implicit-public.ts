import {type RuleContext} from '@eslint/core';
import {type Rule} from 'eslint';

const config: Rule.RuleModule = {
    create(context) {
        return {
            MethodDefinition: (node) => checkImplicitPublic(context, node),
            PropertyDefinition: (node) => checkImplicitPublic(context, node),
            TSParameterProperty: (node) => checkImplicitPublic(context, node),
        };
    },
    meta: {
        fixable: 'code',
        schema: [],
        type: 'problem',
    },
};

function checkImplicitPublic(context: RuleContext, node: any): void {
    const classRef = getClass(node);

    if (!classRef || node.kind === 'constructor' || !!node?.accessibility) {
        return;
    }

    const name = node?.key?.name || node?.parameter?.name;

    let range = node?.parameter?.range ?? node.key.range ?? node.range;

    if (node.kind === 'set' || node.kind === 'get') {
        const [start, end] = node.key.range;

        range = [start - node.kind.length - 1, end - node.kind.length - 1];
    } else if (node.kind === 'method' && node.key?.object?.name === 'Symbol') {
        const [start, end] = range;

        range = [start - 1, end - 1];
    }

    if (node.type === 'PropertyDefinition' && node.decorators.length > 0) {
        const [, end] = node?.decorators?.[node.decorators.length - 1]?.range ?? [];

        range = [end + 1, end + 2];
    }

    const marked = ' public ';

    context.report({
        fix: (fixer) => fixer.insertTextBeforeRange(range, marked),
        message: `${node.kind || 'property'} ${name} should be marked as ${marked.trim()}`,
        node,
    });
}

function getClass(node: any): Rule.Node['parent'] | null {
    if (!!node.parent && node.parent?.type === 'ClassDeclaration') {
        return node.parent;
    }

    if (node.parent) {
        return getClass(node.parent);
    }

    return null;
}

export default config;
