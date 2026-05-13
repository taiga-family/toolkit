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

function cssRule(declarations: readonly string[]): string {
    return `.icon { ${declarations.join('; ')}; }`;
}

const lintScript = `
    const input = JSON.parse(require('node:fs').readFileSync(0, 'utf-8'));
    require('ts-node').register({
        compilerOptions: {
            module: 'Node16',
            moduleResolution: 'node16',
        },
        project: input.tsConfigPath,
        transpileOnly: true,
    });
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
            rulePath: resolve(__dirname, '../rules/no-mask-shorthand.ts'),
            tsConfigPath: resolve(__dirname, '../tsconfig.json'),
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
            ]),
        );
    });

    it('moves a single mask image into mask-image', () => {
        const result = lint(
            '.icon { mask: linear-gradient(to right, transparent 0, black 3rem, black calc(100% - 3rem), transparent 100%); }',
            true,
        );

        expect(result.code).toBe(
            cssRule([
                'mask-image: linear-gradient(to right, transparent 0, black 3rem, black calc(100% - 3rem), transparent 100%)',
            ]),
        );
    });

    it('moves none into mask-image', () => {
        const result = lint('.icon { mask: none; }', true);

        expect(result.code).toBe(cssRule(['mask-image: none']));
    });

    it('treats preprocessor variables as mask images', () => {
        const result = lint('.icon { mask: @icon no-repeat; }', true);

        expect(result.code).toBe(
            cssRule(['mask-image: @icon', 'mask-repeat: no-repeat']),
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
                'mask-origin: padding-box',
                'mask-clip: no-clip',
                'mask-mode: alpha',
                'mask-composite: subtract',
            ]),
        );
    });

    it('reports but does not fix css-wide keywords', () => {
        const result = lint('.icon { mask: inherit !important; }', true);

        expect(result.warnings).toHaveLength(1);
        expect(result.code).toBe('.icon { mask: inherit !important; }');
    });

    it('keeps existing longhands while replacing shorthand with mask-image', () => {
        const result = lint(
            ".icon { mask-repeat: no-repeat; mask: url('a.svg'); }",
            true,
        );

        expect(result.code).toBe(
            cssRule(['mask-repeat: no-repeat', "mask-image: url('a.svg')"]),
        );
    });

    it('does not add mask-border reset longhands', () => {
        const result = lint(
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
            cssRule(["mask-image: url('a.svg')", 'mask-repeat: repeat-block']),
        );
    });

    it('expands mask-size keywords after slash', () => {
        const result = lint(".icon { mask: url('a.svg') center / cover; }", true);

        expect(result.code).toBe(
            cssRule([
                "mask-image: url('a.svg')",
                'mask-position: center',
                'mask-size: cover',
            ]),
        );
    });
});
