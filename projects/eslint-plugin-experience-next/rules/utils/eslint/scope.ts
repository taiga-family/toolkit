import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

export function getResolvedVariable(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Identifier,
): TSESLint.Scope.Variable | null {
    const scope = sourceCode.getScope(node);
    const reference = scope.references.find((item) => item.identifier === node);

    return reference?.resolved ?? null;
}

export function hasVariableInScope(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
    name: string,
): boolean {
    let scope: ReturnType<typeof sourceCode.getScope> | null = sourceCode.getScope(node);

    while (scope) {
        if (scope.variables.some((variable) => variable.name === name)) {
            return true;
        }

        scope = scope.upper;
    }

    return false;
}
