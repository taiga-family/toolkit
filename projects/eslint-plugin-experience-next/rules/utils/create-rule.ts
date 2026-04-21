import {ESLintUtils, type TSESLint} from '@typescript-eslint/utils';
import {type Rule} from 'eslint';

const RULE_DOCS_BASE_URL =
    'https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs';

const ruleCreator = ESLintUtils.RuleCreator(
    (name: string) => `${RULE_DOCS_BASE_URL}/${name}.md`,
);

export function createRule<Options extends readonly unknown[]>(options: {
    name: string;
    rule: Rule.RuleModule;
}): TSESLint.RuleModule<string, Options> & {name: string};
export function createRule<Options extends readonly unknown[], MessageIds extends string>(
    options: Parameters<typeof ruleCreator<Options, MessageIds>>[0],
): ReturnType<typeof ruleCreator<Options, MessageIds>>;
export function createRule(options: any): any {
    if ('rule' in options) {
        const {name, rule} = options as {name: string; rule: Rule.RuleModule};
        const meta = rule.meta ?? {};
        const docs = meta.docs ?? {};

        return ruleCreator({
            create: (context) =>
                rule.create(
                    context as unknown as Rule.RuleContext,
                ) as TSESLint.RuleListener,
            meta: {
                ...(meta as Omit<TSESLint.RuleMetaData<string>, 'docs'>),
                docs: {
                    ...(docs as TSESLint.RuleMetaDataDocs),
                    description:
                        typeof docs.description === 'string' ? docs.description : name,
                },
            },
            name,
        });
    }

    return ruleCreator(options);
}
