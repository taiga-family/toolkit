import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {getDecoratorMetadata} from './utils/get-decorator-metadata';
import {getImportsArray} from './utils/get-imports-array';
import {getSortedNames} from './utils/get-sorted-names';
import {nameOf} from './utils/name-of';
import {sameOrder} from './utils/same-order';

type Options = [{decorators?: string[]}];

type MessageIds = 'incorrectOrder';

const createRule = ESLintUtils.RuleCreator((name) => name);

export default createRule<Options, MessageIds>({
    create(context, [options]) {
        const allowed = new Set(options.decorators);
        const source = context.sourceCode;

        return {
            ClassDeclaration(node?: TSESTree.ClassDeclaration) {
                for (const decorator of node?.decorators ?? []) {
                    const meta = getDecoratorMetadata(decorator, allowed);

                    if (!meta) {
                        continue;
                    }

                    const arr = getImportsArray(meta);

                    if (!arr) {
                        continue;
                    }

                    const elements = arr.elements.filter(
                        (el): el is TSESTree.Expression | TSESTree.SpreadElement =>
                            el !== null,
                    );

                    if (elements.length <= 1) {
                        continue;
                    }

                    const expectedNames = getSortedNames(elements, source);
                    const currentNames = elements.map((el) => nameOf(el, source));

                    if (sameOrder(currentNames, expectedNames)) {
                        continue;
                    }

                    context.report({
                        data: {expected: expectedNames.join(', ')},
                        fix: (fixer) =>
                            fixer.replaceTextRange(
                                arr.range,
                                `[${expectedNames.join(', ')}]`,
                            ),
                        messageId: 'incorrectOrder',
                        node: arr,
                    });
                }
            },
        };
    },
    defaultOptions: [
        {
            decorators: ['Component', 'Directive', 'NgModule', 'Pipe'],
        },
    ],
    meta: {
        docs: {
            description: 'Sort Angular standalone imports inside decorators.',
        },
        fixable: 'code',
        messages: {
            incorrectOrder: 'Order in imports should be [{{expected}}]',
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    decorators: {
                        items: {type: 'string'},
                        type: 'array',
                    },
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'standalone-imports-sort',
});
