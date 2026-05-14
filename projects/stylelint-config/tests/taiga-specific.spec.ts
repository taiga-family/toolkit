import {describe, expect, it} from '@jest/globals';

import {
    type LintOutput,
    lintWithStylelint,
    loadStylelintFixture,
} from './stylelint-test-utils';

interface StylelintConfig {
    readonly rules: Readonly<Record<string, unknown>>;
}

const ruleName = 'custom-property-pattern';
const config = loadStylelintFixture<StylelintConfig>('../taiga-specific');

async function lint(code: string): Promise<LintOutput> {
    return lintWithStylelint({
        code,
        config: {rules: {[ruleName]: config.rules[ruleName]}},
    });
}

describe('taiga-specific config', () => {
    it('allows prefixed kebab-case custom properties', async () => {
        const result = await lint(`
            .theme {
                --t-a: 1rem;
                --tui-size: 1rem;
                --docsearch-hit-color: #fff;
            }
        `);

        expect(result.warnings).toEqual([]);
    });

    it('reports custom properties with an extra character before kebab-case name', async () => {
        const result = await lint(`
            .theme {
                --tui-_size: 1rem;
                --tui-.size: 1rem;
            }
        `);

        expect(result.warnings.map(({rule}) => rule)).toEqual([ruleName, ruleName]);
    });
});
