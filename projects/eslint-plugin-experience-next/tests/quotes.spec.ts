import {RuleTester} from 'eslint';

import quotes from '../rules/recommended/quotes';

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@angular-eslint/template-parser')},
});

ruleTester.run('quotes', quotes, {
    invalid: [
        {
            code: /* HTML */ "<div class='foo'></div>",
            errors: [{messageId: 'unexpected'}],
            output: '<div class="foo"></div>',
        },
        {
            code: /* HTML */ '<div class=foo></div>',
            errors: [{messageId: 'missing'}],
            output: '<div class="foo"></div>',
        },
        {
            code: /* HTML */ "<div id='foo'></div>",
            errors: [{messageId: 'unexpected'}],
            output: '<div id="foo"></div>',
        },
        {
            code: /* HTML */ "<div [title]='foo'></div>",
            errors: [{messageId: 'unexpected'}],
            output: '<div [title]="foo"></div>',
        },
    ],
    valid: [
        {code: /* HTML */ '<div class="foo"></div>'},
        {code: /* HTML */ '<div [title]="foo"></div>'},
        {
            code: /* HTML */ `
                <div [title]='"Hello"'></div>
            `,
        },
        {code: /* HTML */ '<tui-textfield iconStart=" " />'},
        {code: /* HTML */ '<div id="foo"></div>'},
        {
            code: /* HTML */ `
                <div id='containing "double" quotes'></div>
            `,
        },
        {code: /* HTML */ '<input postfix=" per day" />'},
        {
            code: /* HTML */ `
                <span [tuiSkeleton]="skeleton ? 'placeholder text' : ''">text</span>
            `,
        },
    ],
});
