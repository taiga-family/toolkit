import {describe, expect, it} from '@jest/globals';

import {
    type LintOutput,
    lintWithStylelint,
    loadStylelintFixture,
} from './stylelint-test-utils';

interface StylelintConfig {
    readonly customSyntax?: unknown;
    readonly rules: Readonly<Record<string, unknown>>;
}

const ruleName = 'declaration-property-value-disallowed-list';
const config = loadStylelintFixture<StylelintConfig>('../index');

async function lint(code: string): Promise<LintOutput> {
    return lintWithStylelint({
        code,
        config: {
            customSyntax: config.customSyntax,
            rules: {[ruleName]: config.rules[ruleName]},
        },
    });
}

describe('fit-content restriction', () => {
    it('reports fit-content for min and max block-size properties', async () => {
        const result = await lint(`
            .textfield {
                min-block-size: fit-content;
                max-block-size: FIT-CONTENT;
                min-height: var(--textfield-size, fit-content);
                max-height: fit-content;
            }
        `);

        expect(result.warnings.map(({rule}) => rule)).toEqual([
            ruleName,
            ruleName,
            ruleName,
            ruleName,
        ]);
        expect(result.warnings.map(({text}) => text)).toEqual([
            expect.stringContaining('property "min-block-size"'),
            expect.stringContaining('property "max-block-size"'),
            expect.stringContaining('property "min-height"'),
            expect.stringContaining('property "max-height"'),
        ]);
    });

    it('allows fit-content outside min and max block-size properties', async () => {
        const result = await lint(`
            .layout {
                block-size: fit-content;
                height: fit-content;
                inline-size: fit-content;
                max-inline-size: fit-content;
                max-width: fit-content;
                min-inline-size: fit-content;
                min-width: fit-content;
                width: fit-content;
            }
        `);

        expect(result.warnings).toEqual([]);
    });
});
