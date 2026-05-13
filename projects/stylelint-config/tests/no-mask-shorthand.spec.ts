import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';

import {describe, expect, it} from '@jest/globals';

interface LintOutput {
    readonly code?: string;
    readonly warnings: ReadonlyArray<{
        readonly rule?: string;
        readonly text: string;
    }>;
}

const maskBorderResets = [
    'mask-border-source: none',
    'mask-border-mode: alpha',
    'mask-border-outset: 0',
    'mask-border-repeat: stretch',
    'mask-border-slice: 0',
    'mask-border-width: auto',
];

const defaultMaskLonghands = [
    'mask-repeat: repeat',
    'mask-position: 0% 0%',
    'mask-size: auto',
    'mask-origin: border-box',
    'mask-clip: border-box',
    'mask-mode: match-source',
    'mask-composite: add',
];

function cssRule(declarations: readonly string[]): string {
    return `.icon { ${declarations.join('; ')}; }`;
}

const lintScript = `
    const input = JSON.parse(require('node:fs').readFileSync(0, 'utf-8'));
    const stylelint = require('stylelint');
    const rule = require(input.rulePath);

    stylelint
        .lint({
            code: input.code,
            config: {
                plugins: [rule],
                rules: {'@taiga-ui/no-mask-shorthand': true},
            },
            fix: input.fix,
        })
        .then((result) => {
            const warnings = result.results[0].warnings.map(({rule, text}) => ({
                rule,
                text,
            }));

            process.stdout.write(JSON.stringify({code: result.code, warnings}));
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
`;

function lint(code: string, fix = false): LintOutput {
    const output = execFileSync(process.execPath, ['-e', lintScript], {
        encoding: 'utf-8',
        input: JSON.stringify({
            code,
            fix,
            rulePath: resolve(__dirname, '../rules/no-mask-shorthand.js'),
        }),
    });

    return JSON.parse(output) as LintOutput;
}

describe('@taiga-ui/no-mask-shorthand', () => {
    it('allows mask longhands', () => {
        const result = lint(`
            .icon {
                mask-image: var(--icon);
                mask-repeat: no-repeat;
                mask-position: center;
                mask-size: 1rem;
            }
        `);

        expect(result.warnings).toEqual([]);
    });

    it('expands a single mask layer', () => {
        const result = lint(
            ".icon { mask: url('icon.svg') no-repeat center / 1rem; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('icon.svg')",
                'mask-repeat: no-repeat',
                'mask-position: center',
                'mask-size: 1rem',
                'mask-origin: border-box',
                'mask-clip: border-box',
                'mask-mode: match-source',
                'mask-composite: add',
                ...maskBorderResets,
            ]),
        );
    });

    it('treats preprocessor variables as mask images', () => {
        const result = lint('.icon { mask: @icon no-repeat; }', true);

        expect(result.code).toBe(
            cssRule([
                'mask-image: @icon',
                'mask-repeat: no-repeat',
                ...defaultMaskLonghands.slice(1),
                ...maskBorderResets,
            ]),
        );
    });

    it('reports but does not fix css variables because they can contain shorthand values', () => {
        const result = lint('.icon { mask: var(--mask); }', true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe('.icon { mask: var(--mask); }');
    });

    it('expands repeated values in multiple mask layers once', () => {
        const result = lint(
            ".icon { mask: url('a.svg') no-repeat center / 1rem, linear-gradient(#000, #000) no-repeat center / 1rem; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg'), linear-gradient(#000, #000)",
                'mask-repeat: no-repeat',
                'mask-position: center',
                'mask-size: 1rem',
                'mask-origin: border-box',
                'mask-clip: border-box',
                'mask-mode: match-source',
                'mask-composite: add',
                ...maskBorderResets,
            ]),
        );
    });

    it('fills omitted layer values when another layer declares the longhand', () => {
        const result = lint(
            ".icon { mask: url('a.svg') no-repeat, url('b.svg') center / 1rem; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg'), url('b.svg')",
                'mask-repeat: no-repeat, repeat',
                'mask-position: 0% 0%, center',
                'mask-size: auto, 1rem',
                'mask-origin: border-box',
                'mask-clip: border-box',
                'mask-mode: match-source',
                'mask-composite: add',
                ...maskBorderResets,
            ]),
        );
    });

    it('expands geometry boxes, mask mode, and compositing operator', () => {
        const result = lint(
            ".icon { mask: url('a.svg') padding-box no-clip subtract alpha; }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg')",
                ...defaultMaskLonghands.slice(0, 3),
                'mask-origin: padding-box',
                'mask-clip: no-clip',
                'mask-mode: alpha',
                'mask-composite: subtract',
                ...maskBorderResets,
            ]),
        );
    });

    it('expands css-wide keywords to every longhand', () => {
        const result = lint('.icon { mask: inherit !important; }', true);

        expect(result.code).toBe(
            cssRule([
                'mask-image: inherit !important',
                'mask-repeat: inherit !important',
                'mask-position: inherit !important',
                'mask-size: inherit !important',
                'mask-origin: inherit !important',
                'mask-clip: inherit !important',
                'mask-mode: inherit !important',
                'mask-composite: inherit !important',
                ...maskBorderResets.map((declaration) => `${declaration} !important`),
            ]),
        );
    });

    it('preserves shorthand reset semantics for omitted longhands', () => {
        const result = lint(
            ".icon { mask-repeat: no-repeat; mask: url('a.svg'); }",
            true,
        );

        expect(result.code).toBe(
            cssRule([
                'mask-repeat: no-repeat',
                "mask-image: url('a.svg')",
                ...defaultMaskLonghands,
                ...maskBorderResets,
            ]),
        );
    });

    it('preserves mask-border reset semantics', () => {
        const result = lint(
            ".icon { mask-border-source: url('border.svg'); mask: url('a.svg'); }",
            true,
        );

        expect(result.code).toContain('mask-border-source: none');
    });

    it('reports but does not fix unknown shorthand values', () => {
        const result = lint('.icon { mask: unknown-token; }', true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe('.icon { mask: unknown-token; }');
    });

    it('reports but does not fix mask-size keywords before slash', () => {
        const result = lint(".icon { mask: url('a.svg') cover; }", true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe(".icon { mask: url('a.svg') cover; }");
    });

    it('expands logical repeat keywords', () => {
        const result = lint(".icon { mask: url('a.svg') repeat-block; }", true);

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg')",
                'mask-repeat: repeat-block',
                ...defaultMaskLonghands.slice(1),
                ...maskBorderResets,
            ]),
        );
    });

    it('expands mask-size keywords after slash', () => {
        const result = lint(".icon { mask: url('a.svg') center / cover; }", true);

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg')",
                'mask-repeat: repeat',
                'mask-position: center',
                'mask-size: cover',
                ...defaultMaskLonghands.slice(3),
                ...maskBorderResets,
            ]),
        );
    });
});
