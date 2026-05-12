import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getLocalNameForImport} from '../utils/angular/angular-imports';
import {getEnclosingClass} from '../utils/ast/ancestors';
import {unwrapExpression} from '../utils/ast/ast-expressions';
import {createRule} from '../utils/create-rule';
import {getResolvedVariable} from '../utils/eslint/scope';

type MessageId = 'noSignalOutsideClass';

const ANGULAR_CORE = '@angular/core';
const SIGNAL_FACTORIES = ['computed', 'effect', 'linkedSignal', 'signal'] as const;

function isSignalFactoryCall(
    node: TSESTree.Expression | null | undefined,
    factoryNames: ReadonlySet<string>,
): boolean {
    if (!node) {
        return false;
    }

    const expression = unwrapExpression(node);

    return (
        expression.type === AST_NODE_TYPES.CallExpression &&
        expression.callee.type === AST_NODE_TYPES.Identifier &&
        factoryNames.has(expression.callee.name)
    );
}

function getModuleScopeVariableDeclaration(
    statement: TSESTree.Program['body'][number],
): TSESTree.VariableDeclaration | null {
    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
        return statement;
    }

    if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) {
        return null;
    }

    return statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration
        ? statement.declaration
        : null;
}

function collectModuleScopeSignalNames(
    program: TSESTree.Program,
    factoryNames: ReadonlySet<string>,
): ReadonlySet<string> {
    const names = new Set<string>();

    for (const statement of program.body) {
        const declaration = getModuleScopeVariableDeclaration(statement);

        if (!declaration) {
            continue;
        }

        for (const declarator of declaration.declarations) {
            if (
                declarator.id.type === AST_NODE_TYPES.Identifier &&
                isSignalFactoryCall(declarator.init, factoryNames)
            ) {
                names.add(declarator.id.name);
            }
        }
    }

    return names;
}

export const rule = createRule<[], MessageId>({
    create(context) {
        const program = context.sourceCode.ast;
        const factoryNames = new Set<string>();

        for (const name of SIGNAL_FACTORIES) {
            const localName = getLocalNameForImport(program, ANGULAR_CORE, name);

            if (localName) {
                factoryNames.add(localName);
            }
        }

        if (factoryNames.size === 0) {
            return {};
        }

        const moduleScopeSignals = collectModuleScopeSignalNames(program, factoryNames);

        return moduleScopeSignals.size === 0
            ? {}
            : {
                  PropertyDefinition(node: TSESTree.PropertyDefinition) {
                      const value = node.value ? unwrapExpression(node.value) : null;

                      if (
                          value?.type !== AST_NODE_TYPES.Identifier ||
                          !moduleScopeSignals.has(value.name)
                      ) {
                          return;
                      }

                      const variable = getResolvedVariable(context.sourceCode, value);

                      if (!variable) {
                          return;
                      }

                      const enclosingClass = getEnclosingClass(node);

                      const isUsedElsewhere = variable.references.some(
                          (ref) =>
                              ref.isRead() &&
                              getEnclosingClass(ref.identifier) !== enclosingClass,
                      );

                      if (isUsedElsewhere) {
                          return;
                      }

                      context.report({
                          data: {name: value.name},
                          messageId: 'noSignalOutsideClass',
                          node: value,
                      });
                  },
              };
    },
    meta: {
        docs: {
            description:
                'Disallow class properties that reference a module-scope Angular signal; move the signal creation into the class body',
        },
        messages: {
            noSignalOutsideClass:
                '`{{name}}` is a module-scope signal. Move it into the class body: `{{name}} = signal(...)`.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-signal-outside-class',
});

export default rule;
