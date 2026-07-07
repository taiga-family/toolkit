import {createJiti} from 'jiti';

interface StylelintWarning {
    readonly rule?: string;
    readonly text: string;
}

export interface LintOutput {
    readonly code?: string;
    readonly warnings: readonly StylelintWarning[];
}

interface StylelintLintResult {
    readonly warnings: readonly StylelintWarning[];
}

interface StylelintApi {
    lint(options: StylelintLintOptions): Promise<StylelintResult>;
}

interface StylelintConfig {
    readonly customSyntax?: unknown;
    readonly plugins?: readonly unknown[];
    readonly rules: Readonly<Record<string, unknown>>;
}

interface StylelintLintOptions {
    readonly code: string;
    readonly config: StylelintConfig;
    readonly fix?: boolean;
}

interface StylelintResult {
    readonly code?: string;
    readonly results: readonly StylelintLintResult[];
}

// CI sets TIMING=true, which makes stylelint lazily `await import('./timing.mjs')`.
// jiti runs that native dynamic import inside Jest's VM, which the runner rejects.
// The perf report is useless in unit tests, so keep the feature off.
delete process.env.TIMING;

// Stylelint 17 is ESM-only; jiti keeps tests in-process under the CJS Jest runtime.
const jiti = createJiti(__filename);
const stylelint = jiti('stylelint') as StylelintApi;

export function loadStylelintFixture<T = unknown>(id: string): T {
    return jiti(id) as T;
}

export async function lintWithStylelint(
    options: StylelintLintOptions,
): Promise<LintOutput> {
    const {code, results} = await stylelint.lint(options);
    const [result] = results;

    return {
        code,
        warnings:
            result?.warnings.map(({rule, text}) => ({
                rule,
                text,
            })) ?? [],
    };
}
