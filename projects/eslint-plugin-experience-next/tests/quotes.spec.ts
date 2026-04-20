import {RuleTester} from 'eslint';

import quotes from '../rules/quotes';

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
    ],
    valid: [
        {code: /* HTML */ '<div class="foo"></div>'},
        {code: /* HTML */ '<div [title]="foo"></div>'},
    ],
});
