import {type TSESLint, type TSESTree} from '@typescript-eslint/utils';

export function getResolvedVariable(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Identifier,
): TSESLint.Scope.Variable | null {
    const scope = sourceCode.getScope(node);
    const reference = scope.references.find((item) => item.identifier === node);

    return reference?.resolved ?? null;
}
