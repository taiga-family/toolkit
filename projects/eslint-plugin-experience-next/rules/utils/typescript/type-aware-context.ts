import {ESLintUtils, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {type NodeMap, type TsNodeToESTreeNodeMap} from './node-map';

type ParserServices = ReturnType<typeof ESLintUtils.getParserServices>;

export interface TypeAwareRuleContext {
    readonly checker: ts.TypeChecker;
    readonly esTreeNodeToTSNodeMap: NodeMap;
    readonly parserServices: ParserServices;
    readonly program: TSESTree.Program;
    readonly sourceCode: Readonly<TSESLint.SourceCode>;
    readonly tsNodeToESTreeNodeMap: TsNodeToESTreeNodeMap;
    readonly tsProgram: ts.Program;
}

export function getTypeAwareRuleContext<
    MessageId extends string,
    Options extends readonly unknown[],
>(context: Readonly<TSESLint.RuleContext<MessageId, Options>>): TypeAwareRuleContext {
    const parserServices = ESLintUtils.getParserServices(context);
    const {sourceCode} = context;
    const tsProgram = parserServices.program as unknown as ts.Program;

    const esTreeNodeToTSNodeMap =
        parserServices.esTreeNodeToTSNodeMap as unknown as NodeMap;

    const tsNodeToESTreeNodeMap =
        parserServices.tsNodeToESTreeNodeMap as unknown as TsNodeToESTreeNodeMap;

    return {
        checker: tsProgram.getTypeChecker(),
        esTreeNodeToTSNodeMap,
        parserServices,
        program: sourceCode.ast,
        sourceCode,
        tsNodeToESTreeNodeMap,
        tsProgram,
    };
}
