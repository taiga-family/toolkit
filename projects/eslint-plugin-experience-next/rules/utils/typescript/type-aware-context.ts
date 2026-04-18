import {ESLintUtils, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

type ParserServices = ReturnType<typeof ESLintUtils.getParserServices>;

export interface TypeAwareRuleContext {
    readonly checker: ts.TypeChecker;
    readonly esTreeNodeToTSNodeMap: ParserServices['esTreeNodeToTSNodeMap'];
    readonly parserServices: ParserServices;
    readonly program: TSESTree.Program;
    readonly sourceCode: Readonly<TSESLint.SourceCode>;
    readonly tsNodeToESTreeNodeMap: ParserServices['tsNodeToESTreeNodeMap'];
    readonly tsProgram: ts.Program;
}

export function getTypeAwareRuleContext<
    MessageId extends string,
    Options extends readonly unknown[],
>(context: Readonly<TSESLint.RuleContext<MessageId, Options>>): TypeAwareRuleContext {
    const parserServices = ESLintUtils.getParserServices(context);
    const {sourceCode} = context;

    return {
        checker: parserServices.program.getTypeChecker(),
        esTreeNodeToTSNodeMap: parserServices.esTreeNodeToTSNodeMap,
        parserServices,
        program: sourceCode.ast as TSESTree.Program,
        sourceCode,
        tsNodeToESTreeNodeMap: parserServices.tsNodeToESTreeNodeMap,
        tsProgram: parserServices.program,
    };
}
