import {describe, expect, it} from '@jest/globals';

import {
    type LintOutput,
    lintWithStylelint,
    loadStylelintFixture,
} from './stylelint-test-utils';

const maskShorthandRule = loadStylelintFixture('../rules/no-mask-shorthand.ts');
const ruleName = '@taiga-ui/no-mask-shorthand';

function cssRule(declarations: readonly string[]): string {
    return `.icon { ${declarations.join('; ')}; }`;
}

async function lint(code: string, fix = false): Promise<LintOutput> {
    return lintWithStylelint({
        code,
        config: {
            plugins: [maskShorthandRule],
            rules: {[ruleName]: true},
        },
        fix,
    });
}

describe('@taiga-ui/no-mask-shorthand', () => {
    it('allows mask longhands', async () => {
        const result = await lint(`
            .icon {
                mask-image: var(--icon);
                mask-repeat: no-repeat;
                mask-position: center;
                mask-size: 1rem;
            }
        `);

        expect(result.warnings).toEqual([]);
    });

    it('expands a single mask layer', async () => {
        const result = await lint(
            ".icon { mask: url('icon.svg') no-repeat center / 1rem; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('icon.svg')",
                'mask-repeat: no-repeat',
                'mask-position: center',
                'mask-size: 1rem',
            ]),
        );
    });

    it('moves a single mask image into mask-image', async () => {
        const result = await lint(
            '.icon { mask: linear-gradient(to right, transparent 0, black 3rem, black calc(100% - 3rem), transparent 100%); }',
            true,
        );

        expect(result.code).toBe(
            cssRule([
                'mask-image: linear-gradient(to right, transparent 0, black 3rem, black calc(100% - 3rem), transparent 100%)',
            ]),
        );
    });

    it('moves none into mask-image', async () => {
        const result = await lint('.icon { mask: none; }', true);

        expect(result.code).toBe(cssRule(['mask-image: none']));
    });

    it('treats preprocessor variables as mask images', async () => {
        const result = await lint('.icon { mask: @icon no-repeat; }', true);

        expect(result.code).toBe(
            cssRule(['mask-image: @icon', 'mask-repeat: no-repeat']),
        );
    });

    it('reports but does not fix css variables because they can contain shorthand values', async () => {
        const result = await lint('.icon { mask: var(--mask); }', true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe('.icon { mask: var(--mask); }');
    });

    it('expands repeated values in multiple mask layers once', async () => {
        const result = await lint(
            ".icon { mask: url('a.svg') no-repeat center / 1rem, linear-gradient(#000, #000) no-repeat center / 1rem; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg'), linear-gradient(#000, #000)",
                'mask-repeat: no-repeat',
                'mask-position: center',
                'mask-size: 1rem',
            ]),
        );
    });

    it('fills omitted layer values when another layer declares the longhand', async () => {
        const result = await lint(
            ".icon { mask: url('a.svg') no-repeat, url('b.svg') center / 1rem; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg'), url('b.svg')",
                'mask-repeat: no-repeat, repeat',
                'mask-position: 0% 0%, center',
                'mask-size: auto, 1rem',
            ]),
        );
    });

    it('expands geometry boxes, mask mode, and compositing operator', async () => {
        const result = await lint(
            ".icon { mask: url('a.svg') padding-box no-clip subtract alpha; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg')",
                'mask-origin: padding-box',
                'mask-clip: no-clip',
                'mask-mode: alpha',
                'mask-composite: subtract',
            ]),
        );
    });

    it('reports but does not fix css-wide keywords', async () => {
        const result = await lint('.icon { mask: inherit !important; }', true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe('.icon { mask: inherit !important; }');
    });

    it('keeps existing longhands while replacing shorthand with mask-image', async () => {
        const result = await lint(
            ".icon { mask-repeat: no-repeat; mask: url('a.svg'); }",
            true,
        );

        expect(result.code).toBe(
            cssRule(['mask-repeat: no-repeat', "mask-image: url('a.svg')"]),
        );
    });

    it('does not add mask-border reset longhands', async () => {
        const result = await lint(
            ".icon { mask-border-source: url('border.svg'); mask: url('a.svg'); }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-border-source: url('border.svg')",
                "mask-image: url('a.svg')",
            ]),
        );
    });

    it('reports but does not fix unknown shorthand values', async () => {
        const result = await lint('.icon { mask: unknown-token; }', true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe('.icon { mask: unknown-token; }');
    });

    it('reports but does not fix mask-size keywords before slash', async () => {
        const result = await lint(".icon { mask: url('a.svg') cover; }", true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe(".icon { mask: url('a.svg') cover; }");
    });

    it('expands logical repeat keywords', async () => {
        const result = await lint(".icon { mask: url('a.svg') repeat-block; }", true);

        expect(result.code).toBe(
            cssRule(["mask-image: url('a.svg')", 'mask-repeat: repeat-block']),
        );
    });

    it('expands mask-size keywords after slash', async () => {
        const result = await lint(".icon { mask: url('a.svg') center / cover; }", true);

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg')",
                'mask-position: center',
                'mask-size: cover',
            ]),
        );
    });
});
