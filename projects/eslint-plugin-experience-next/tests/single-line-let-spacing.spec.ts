import {RuleTester} from 'eslint';

import {rule} from '../rules/recommended/single-line-let-spacing';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('single-line-let-spacing', rule, {
    invalid: [
        {
            code: `
                @let a = 1;

                @let b = 2;
            `,
            errors: [{messageId: 'singleLineLetSpacingUnexpectedBlankLine'}],
            output: `
                @let a = 1;
                @let b = 2;
            `,
        },
        {
            code: `
                @let a = 1;

                @let b = 2;

                @let c = 3;
            `,
            errors: [
                {messageId: 'singleLineLetSpacingUnexpectedBlankLine'},
                {messageId: 'singleLineLetSpacingUnexpectedBlankLine'},
            ],
            output: `
                @let a = 1;
                @let b = 2;
                @let c = 3;
            `,
        },
        {
            code: `
                @let a = 1;
                @let b = foo(
                    value
                );
                @let c = 3;
            `,
            errors: [
                {messageId: 'singleLineLetSpacingMissingBlankLineBeforeMultilineLet'},
                {messageId: 'singleLineLetSpacingMissingBlankLineAfterMultilineLet'},
            ],
            output: `
                @let a = 1;

                @let b = foo(
                    value
                );

                @let c = 3;
            `,
        },
        {
            code: `
                @let text = multi() ? texts[2] : texts[1];
                {{ single() ? texts[0] : text }}
            `,
            errors: [
                {messageId: 'singleLineLetSpacingMissingBlankLineBeforeInterpolation'},
            ],
            output: `
                @let text = multi() ? texts[2] : texts[1];

                {{ single() ? texts[0] : text }}
            `,
        },
        {
            code: `
                @let a = 1;
                @let b = 2;
                {{ value }}
            `,
            errors: [
                {messageId: 'singleLineLetSpacingMissingBlankLineBeforeInterpolation'},
            ],
            output: `
                @let a = 1;
                @let b = 2;

                {{ value }}
            `,
        },
        {
            code: `
                <div>
                    @let text = multi() ? texts[2] : texts[1];
                    {{ single() ? texts[0] : text }}
                </div>
            `,
            errors: [
                {messageId: 'singleLineLetSpacingMissingBlankLineBeforeInterpolation'},
            ],
            output: `
                <div>
                    @let text = multi() ? texts[2] : texts[1];

                    {{ single() ? texts[0] : text }}
                </div>
            `,
        },
        {
            code: `
                @if (condition) {
                    @let a = 1;

                    @let b = 2;
                }
            `,
            errors: [{messageId: 'singleLineLetSpacingUnexpectedBlankLine'}],
            output: `
                @if (condition) {
                    @let a = 1;
                    @let b = 2;
                }
            `,
        },
        {
            code: `
                @for (item of items; track item) {
                    @let label = item.name;
                    {{ label }}
                }
            `,
            errors: [
                {messageId: 'singleLineLetSpacingMissingBlankLineBeforeInterpolation'},
            ],
            output: `
                @for (item of items; track item) {
                    @let label = item.name;

                    {{ label }}
                }
            `,
        },
    ],
    valid: [
        {
            code: `
                @let a = 1;
                @let b = 2;
                @let c = 3;
            `,
        },
        {
            code: `
                @let text = multi() ? texts[2] : texts[1];

                {{ single() ? texts[0] : text }}
            `,
        },
        {
            code: `
                @let a = 1;

                @let b = foo(
                    value
                );

                @let c = 3;
            `,
        },
        {
            code: `
                @let foo = bar();
                <div>{{ foo }}</div>
            `,
        },
        {
            code: `
                @let a = 1;
                // comment
                @let b = 2;
            `,
        },
        {
            code: `
                @let a = 1;
                <!-- comment -->
                @let b = 2;
            `,
        },
        {
            code: `
                @let a = 1;
                <!-- comment -->

                @let b = 2;
            `,
        },
        {
            code: `
                @let a = 1;
                <div></div>
                @let b = 2;
            `,
        },
        {
            code: `
                <div>
                    @let text = multi() ? texts[2] : texts[1];

                    {{ single() ? texts[0] : text }}
                </div>
            `,
        },
        {
            code: `
                @if (condition) {
                    @let a = 1;
                    @let b = 2;
                }
            `,
        },
    ],
});
