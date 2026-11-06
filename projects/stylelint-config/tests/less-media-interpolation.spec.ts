import {describe, expect, it} from '@jest/globals';

import {lintWithStylelint} from './stylelint-test-utils';

describe('Less media query interpolation', () => {
    it.each(['tui-mouse', 'tui-mobile'])('parses @media @{%s}', async (variable) => {
        const result = await lintWithStylelint({
            code: `@media @{${variable}} {
                .tui-element {
                    color: red;
                }
            }`,
            codeFilename: 'media.less',
            config: {
                customSyntax: 'postcss-less',
                rules: {'block-no-empty': true},
            },
        });

        expect(result.warnings).toEqual([]);
    });
});
